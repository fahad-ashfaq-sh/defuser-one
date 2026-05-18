<?php

namespace App\Http\Controllers;
use App\Services\DashboardCacheService;

class DashboardController extends Controller
{
    public function __construct
    (private DashboardCacheService $dashboardCache) {}

    public function dashboardData()
    {
        try{
            $data = $this->dashboardCache->getCombinedDashboardData();
            return response()->json([
                'success' => true,
                'message' => 'Data fetched successfully',
                'data' => $data,
            ], 200);
        }catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get dashboard data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}