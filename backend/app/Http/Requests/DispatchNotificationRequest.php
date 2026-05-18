<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * DispatchNotificationRequest — Validates POST /api/v1/simulation/dispatch-notification
 *
 * Stage 7 — Executive Notification Gate.
 * Ensures all telemetry fields are present before dispatching
 * the fiscal resolution alert to the VP of Finance.
 */
class DispatchNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }


    public function rules(): array
    {
        return [
            'patch_id'           => ['required', 'string', 'uuid'],
            'category_slug'      => ['required', 'string', 'max:100'],
            'daily_margin_saved' => ['required', 'numeric'],
            'effective_date'     => ['required', 'date_format:Y-m-d'],
        ];
    }

    public function messages(): array
    {
        return [
            'patch_id.required'           => 'A patch_id is required to trace this notification to its source patch.',
            'patch_id.uuid'               => 'The patch_id must be a valid UUID.',
            'category_slug.required'      => 'The category_slug is required for the notification alert.',
            'daily_margin_saved.required' => 'The daily_margin_saved figure is required for the executive report.',
            'daily_margin_saved.numeric'  => 'The daily_margin_saved must be a numeric value (e.g. 1050.00).',
            'effective_date.required'     => 'The effective_date of the regulation is required.',
            'effective_date.date_format'  => 'The effective_date must be in YYYY-MM-DD format (ISO 8601).',
        ];
    }
}
