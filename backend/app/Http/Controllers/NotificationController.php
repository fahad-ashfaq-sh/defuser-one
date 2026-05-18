<?php

namespace App\Http\Controllers;

use App\Http\Requests\DispatchNotificationRequest;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function dispatch(DispatchNotificationRequest $request): JsonResponse
    {$validated = $request->validated();

    try {
        $category = $validated['category_slug'];
        $margin = number_format($validated['daily_margin_saved'], 2);
        $date = $validated['effective_date'];

        // Storage log mein clear auditing description save karna
        Log::info("SIMULATION: Alert dispatched to VP Finance for patch {$validated['patch_id']}. Target: {$category}. Protection: \${$margin}/day.");

        return response()->json([
            'status'                => 'DISPATCHED',
            'patch_id'              => $validated['patch_id'],
            'delivery_confirmation' => true,
            
            // Frontend terminal drawer is dynamic text ko mazeed barri details ke sath print karega
            'terminal_print'        => "> Dispatching compliance SMS verification to VP Finance... Confirmed. [Category: {$category} | Margin Saved: \${$margin}/day | Effective: {$date}]",
            'dispatched_at'         => now()->toISOString()
        ], 200);

    } catch (Exception $e) {
        return response()->json([
            'status'  => 'NOTIFICATION_FAILURE',
            'error'   => $e->getMessage()
        ], 500);
    }
}
}