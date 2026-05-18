<?php

namespace App\Http\Controllers;

use App\Http\Requests\IngestRequest;
use App\Services\PipelineService;
use App\Services\DashboardCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * DirectiveController
 *
 * Handles POST /api/v1/directive/ingest
 *
 * Orchestrates Stages 1–5 of the 7-Stage Pipeline via PipelineService.
 */
class DirectiveController extends Controller
{
    public function __construct(
        private PipelineService $pipelineService,
        private DashboardCacheService $dashboardCacheService
    ) {}

    /**
     * Execute the 5-stage analysis pipeline on an uploaded regulatory PDF.
     */
    public function ingest(IngestRequest $request): JsonResponse
    {
        try {
            // Extend timeout for this request — Gemini API + full pipeline can exceed 30s default
            set_time_limit(120);

            $filename = null;
            $fullPath = null;
            $rawText  = null;

        if ($request->hasFile('pdf')) {
            // --- S1: Store binary stream to local disk ---
            $filename = $request->file('pdf')->getClientOriginalName();
            $storedPath = $request->file('pdf')->store('directives');

            $fullPath   = Storage::path($storedPath);
        } else {
            // Raw text provided directly from UI
            $rawText = $request->input('raw_text');
            $filename = 'raw_text';
        }

        // --- Execute Pipeline (S1 to S5) ---
        $pipelineResult = $this->pipelineService->run($fullPath, $rawText);
        
        // Handle early exit if no threats were found
        if ($pipelineResult['status'] === 'early_exit') {
            return response()->json($pipelineResult['response'], 200);
        }

        $ingestPayload = $pipelineResult['ingestPayload'];
        $threatPayload = $pipelineResult['threatPayload'];
        $patchPayload  = $pipelineResult['patchPayload'];

        // Build fiscal_metrics as an independent array — one object per verified category
        $fiscalMetricsArray = [];
        foreach ($threatPayload['threats'] ?? [] as $threat) {
            $fiscalMetricsArray[] = [
                'category_slug'        => $threat['category_slug'],
                'tax_tier'             => $threat['tax_tier'],
                'daily_margin_leakage' => $threat['daily_margin_leakage'],
                'affected_sku_count'   => $threat['affected_sku_count'],
            ];
        }
        $this->dashboardCacheService->logSuccess($filename);

        // Return the structured multi-threat response — DB remains clean
        return response()->json([
            'pipeline_status'    => 'HALTED_AWAITING_AUTHORIZATION',
            'ui_directive'       => 'TRANSITION_TO_ALERT_CRIMSON',
            'threat_reference'   => $ingestPayload['threatReference'],
            'patch_id'           => $patchPayload['patch_id'],
            'effective_date'     => $threatPayload['effective_date'],
            'action_summary'     => $ingestPayload['action_summary'] ?? 'Action summary not available.',
            'executive_summary'  => $ingestPayload['executive_summary'] ?? 'Executive summary not available.',
            'terminal_trace_log' => $ingestPayload['terminal_trace_log'] ?? 'Terminal trace log not available.',
            'fiscal_metrics'     => $fiscalMetricsArray,                // Array of per-category objects
            'totals'             => [
                'total_daily_leakage' => $threatPayload['daily_margin_leakage'],
                'total_affected_skus' => $threatPayload['affected_sku_count'],
                'threat_count'        => count($fiscalMetricsArray),
            ],
            'json_patch_preview'     => $patchPayload['json_patch'],
            'trace_log_path'         => $patchPayload['trace_path'],
            'authorization_required' => true,
        ], 200);
    }catch (\Exception $e) {
        $this->dashboardCacheService->FailedLog($filename);
        return response()->json([
            'message' => 'Failed to ingest directive',
            'error' => $e->getMessage(),
        ], 500);
    }
}
}