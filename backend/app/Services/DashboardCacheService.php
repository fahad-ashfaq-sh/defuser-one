<?php
namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Models\SkuInventory;

class DashboardCacheService
{
    private function initializeDefaultStats(): void
    {
        if (!Cache::has('stats:total_ingested')) {
            Cache::forever('stats:total_ingested', 0);
            Cache::forever('stats:active_alerts', 0);
            Cache::forever('stats:regulatory_changes', 0);
        }
    }

    public function storeLog(string $fileName, string $status): void
    {
        $logs   = Cache::get('agent_pdf_logs', []);
        $logs[] = [
            'file_name' => $fileName,
            'status'    => $status,
            'time'      => now()->format('H:i:s'),
        ];

        // Cap at 50 entries so the cache key never grows unbounded
        if (count($logs) > 50) {
            $logs = array_slice($logs, -50);
        }

        Cache::forever('agent_pdf_logs', $logs);
    }

    public function logSuccess(string $fileName): void
    {
        $this->initializeDefaultStats();
        Cache::increment('stats:total_ingested');
        Cache::increment('stats:active_alerts');
        $this->storeLog($fileName, 'proceed');
    }

    /**
     * BUG FIX: the original code did Cache::forever('agent_pdf_logs', 'failed')
     * which overwrote the ENTIRE log array with the plain string "failed",
     * destroying all previous log entries and breaking the frontend log list.
     */
    public function FailedLog(?string $fileName): void
    {
        $this->initializeDefaultStats();
        $this->storeLog($fileName ?? 'unknown', 'failed');
    }

    public function approveThreat(): void
    {
        if (Cache::get('stats:active_alerts', 0) > 0) {
            Cache::decrement('stats:active_alerts');
        }
        Cache::increment('stats:regulatory_changes');
    }

    public function declineThreat(): void
    {
        if (Cache::get('stats:active_alerts', 0) > 0) {
            Cache::decrement('stats:active_alerts');
        }
    }

    public function getCombinedDashboardData(): array
    {
        $this->initializeDefaultStats();

        $skuCount = 0;
        try {
            $skuCount = SkuInventory::count();
        } catch (\Exception $e) {
            $skuCount = 0;
        }

        $logs = Cache::get('agent_pdf_logs', []);

        return [
            'stats' => [
                'total_ingested'     => (int) Cache::get('stats:total_ingested', 0),
                'active_alerts'      => (int) Cache::get('stats:active_alerts', 0),
                'regulatory_changes' => (int) Cache::get('stats:regulatory_changes', 0),
                'actively_monitored' => (int) $skuCount,
            ],
            'logs' => array_reverse($logs),
        ];
    }
}