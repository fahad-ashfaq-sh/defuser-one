<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatchDatabaseRequest;
use App\Http\Requests\RejectPatchRequest;
use App\Models\SkuInventory;
use App\Services\DashboardCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SimulationController extends Controller
{
    public function __construct(private DashboardCacheService $dashboardCache) {}

    /**
     * Stage 6 — APPROVE: Execute the authorized DB patch.
     */
    public function patchDatabase(PatchDatabaseRequest $request): JsonResponse
    {
        $validated    = $request->validated();
        $category     = $request->input('target_category');
        $newTaxTier   = (float) $request->input('payload.tax_tier');
        $marginStatus = $request->input('payload.margin_status', 'SECURED');

        $affectedRowsCount = 0;

        DB::beginTransaction();
        try {
            $affectedRowsCount = SkuInventory::where('category_slug', $category)
                ->update([
                    'applied_tax_rate' => $newTaxTier,
                    'margin_status'    => $marginStatus,
                ]);

            DB::commit();

            // Update dashboard cache: alert resolved, regulatory change recorded
            $this->dashboardCache->approveThreat();

            Log::info("SIMULATION: Dispatching compliance SMS/Email verification to VP Finance at vp.finance@corporate-enterprise.com... Confirmed.");

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'pipeline_status' => 'PATCH_FAILED',
                'ui_directive'    => 'MAINTAIN_ALERT_CRIMSON',
                'error'           => 'DB transaction rolled back — patch execution failed.',
                'detail'          => $e->getMessage(),
            ], 500);
        }

        $emailBody = "URGENT FISCAL UPDATE:\n";
        $emailBody .= "Category '{$category}' has been officially patched due to an FBR regulatory threat.\n";
        $emailBody .= "New Applied Tax Tier: " . ($newTaxTier * 100) . "%\n";
        $emailBody .= "Margin Protection Status: {$marginStatus}\n";
        $emailBody .= "Affected SKUs Updated: {$affectedRowsCount}\n";
        $emailBody .= "Action Taken: The Autonomous Defuser has secured corporate margins. Please verify downstream pricing propagation.";
        
        $smsBody = "Defuser Alert: Patch {$validated['patch_id']} executed for '{$category}'. {$affectedRowsCount} SKUs secured at " . ($newTaxTier * 100) . "% tax tier.";

        return response()->json([
            'status'           => 'SUCCESS',
            'patch_id'         => $validated['patch_id'],
            'message'          => "Database mutation patch deployed successfully.",
            'affected_records' => $affectedRowsCount,
            'simulation_logs'  => [
                'dispatch_target'  => 'vp.finance@corporate-enterprise.com',
                'sms_dispatched'   => $smsBody,
                'email_dispatched' => $emailBody,
                'terminal_print'   => "> SECURED: Regulatory compliance enforced for {$category}. Executed {$affectedRowsCount} row updates."
            ],
            'ui_directive'     => 'MAINTAIN_CORPORATE_GREEN',
            'executed_at'      => now()->toISOString()
        ], 200);
    }

    /**
     * Stage 6 — REJECT: User declines the patch. No DB write occurs.
     * Clears the active alert from the dashboard cache and logs the decision.
     */
    public function rejectPatch(RejectPatchRequest $request): JsonResponse
    {
        $validated = $request->validated();
        // No DB transaction — rejection means zero writes
        $reason = $validated['reject_reason'] ?? 'No reason provided.';

        // Decrement active alert counter in the dashboard cache
        $this->dashboardCache->declineThreat();

        Log::warning("PATCH REJECTED: patch_id={$validated['patch_id']}. Reason: {$reason}. DB remains unchanged.");

        $emailBody = "FISCAL ALERT DISMISSED:\n";
        $emailBody .= "A pending regulatory patch (ID: {$validated['patch_id']}) has been manually rejected by an authorized user.\n";
        $emailBody .= "Reason provided: {$reason}\n";
        $emailBody .= "Action Taken: Zero database modifications were made. The system has resumed normal monitoring.";
        
        $smsBody = "Defuser Alert: Patch {$validated['patch_id']} was REJECTED. Reason: {$reason}. No database changes made.";

        return response()->json([
            'status'        => 'REJECTED',
            'patch_id'      => $validated['patch_id'],
            'message'       => 'Patch has been rejected. The database has NOT been modified.',
            'reject_reason' => $reason,
            'simulation_logs'  => [
                'dispatch_target'  => 'vp.finance@corporate-enterprise.com',
                'sms_dispatched'   => $smsBody,
                'email_dispatched' => $emailBody,
                'terminal_print'   => "> REJECTED: Patch dismissal logged. Threat neutralized without DB modification."
            ],
            'ui_directive'  => 'TRANSITION_TO_CORPORATE_GREEN',
            'rejected_at'   => now()->toISOString(),
        ], 200);
    }
}

