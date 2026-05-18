<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DirectiveController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SimulationController;
use Illuminate\Support\Facades\Route;


Route::prefix('v1')->group(function () {

    Route::post('/directive/ingest', [DirectiveController::class, 'ingest'])
        ->name('directive.ingest');

    Route::post('/simulation/patch-database', [SimulationController::class, 'patchDatabase'])
        ->name('simulation.patch-database');

    // Stage 6 — REJECT: User declines patch — no DB write, clears alert from dashboard
    Route::post('/simulation/reject-patch', [SimulationController::class, 'rejectPatch'])
        ->name('simulation.reject-patch');

    Route::post('/simulation/dispatch-notification', [NotificationController::class, 'dispatch'])
        ->name('simulation.dispatch-notification');

    Route::get('/dashboard/data', [DashboardController::class, 'dashboardData'])
        ->name('dashboard.data');

    Route::get('/test', function () {
        return response()->json([
            'status' => 'Backend Connected Successfully'
        ]);
    });
});

