<?php

namespace App\Services\Agents;

use App\Models\SkuInventory;
use App\Support\AgentTraceWriter;
use Illuminate\Support\Str;

class DatabasePatchAgent
{
    public function __construct(private AgentTraceWriter $traceWriter) {}

    /**
     * Formulate a multi-category JSON patch and write the trace log.
     *
     * @param  array $ingestPayload  From DocumentIngestAgent::run()
     * @param  array $threatPayload  From FiscalThreatAnalyzer::run()
     */
    public function formulate(array $ingestPayload, array $threatPayload): array
    {
        $patchId = (string) Str::uuid();

        // --- Accumulate operations for ALL detected threat categories ---
        $operations = [];

        $threats = $threatPayload['threats'] ?? [];

        foreach ($threats as $threat) {
            $currentSlug   = $threat['category_slug'];
            $currentTaxTier = $threat['tax_tier'];

            // Determine margin status per category based on its own leakage
            $marginStatus = 'UNCHANGED';
            if ($threat['daily_margin_leakage'] > 0) {
                $marginStatus = 'SECURED';
            } elseif ($threat['daily_margin_leakage'] < 0) {
                $marginStatus = 'OPTIMIZED';
            }

            // Per-category SKU count via direct clean Eloquent query
            $currentCount = SkuInventory::where('category_slug', $currentSlug)->count();

            // Operation 1: Update tax rate for this category
            $operations[] = [
                'op'              => 'replace',
                'target_column'   => 'applied_tax_rate',
                'target_category' => $currentSlug,
                'new_value'       => $currentTaxTier,
                'affected_skus'   => $currentCount,
                'sku_target'      => 'ALL:category_slug=' . $currentSlug,
            ];

            // Operation 2: Flag margin_status for this category
            $operations[] = [
                'op'              => 'replace',
                'target_column'   => 'margin_status',
                'target_category' => $currentSlug,
                'new_value'       => $marginStatus,
                'affected_skus'   => $currentCount,
                'sku_target'      => 'ALL:category_slug=' . $currentSlug,
            ];
        }

        $jsonPatch = [
            'patch_id'         => $patchId,
            'threat_reference' => $ingestPayload['threatReference'],
            'status'           => 'PENDING_AUTHORIZATION',
            'operations'       => $operations,   // Master accumulated list — all categories
            'metadata'         => [
                'effective_date'       => $threatPayload['effective_date'],
                'total_daily_leakage'  => $threatPayload['daily_margin_leakage'],
                'total_affected_skus'  => $threatPayload['affected_sku_count'],
                'threat_count'         => count($threats),
                'formulated_at'        => now()->toISOString(),
            ],
        ];

        // --- Full Pipeline Trace ---
        $fullTrace = [
            'trace_id'        => $patchId,
            'pipeline_stage'  => 'STAGE_5_PATCH_FORMULATION',
            'timestamp'       => now()->toISOString(),
            'agents_executed' => [
                'DocumentIngestAgent' => [
                    'status'            => 'COMPLETED',
                    'output_keys'       => ['threatReference', 'tariffTable', 'legalProse'],
                    'threat_reference'  => $ingestPayload['threatReference'],
                    'tariff_rows_found' => count($ingestPayload['tariffTable']),
                ],
                'FiscalThreatAnalyzer' => [
                    'status'          => 'COMPLETED',
                    'reasoning_chain' => $threatPayload['reasoning_chain'],
                    'threats_analyzed'=> $threats,
                    'totals'          => [
                        'effective_date'       => $threatPayload['effective_date'],
                        'daily_margin_leakage' => $threatPayload['daily_margin_leakage'],
                        'affected_sku_count'   => $threatPayload['affected_sku_count'],
                    ],
                ],
                'DatabasePatchAgent' => [
                    'status'     => 'COMPLETED',
                    'json_patch' => $jsonPatch,
                ],
            ],
            'pipeline_status' => 'HALTED_AWAITING_AUTHORIZATION',
            'ui_state'        => 'ALERT_CRIMSON',
            'ui_directive'    => 'TRANSITION_TO_ALERT_CRIMSON',
            'conclusion'      => sprintf(
                '%d fiscal threat(s) isolated. Total $Daily_Margin_Leakage$ = $%.2f. JSON patch formulated for %d operations. User authorization required.',
                count($threats),
                $threatPayload['daily_margin_leakage'],
                count($operations)
            ),
            'confidence_score' => 0.99,
        ];

        $tracePath = $this->traceWriter->write($patchId, $fullTrace);

        return [
            'patch_id'         => $patchId,
            'threat_reference' => $ingestPayload['threatReference'],
            'status'           => 'PENDING_AUTHORIZATION',
            'json_patch'       => $jsonPatch,
            'trace_path'       => $tracePath,
        ];
    }
}
