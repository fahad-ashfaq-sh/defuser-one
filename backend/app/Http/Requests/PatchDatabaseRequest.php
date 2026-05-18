<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PatchDatabaseRequest — Validates POST /api/v1/simulation/patch-database
 *
 * Stage 6 Authorization Gate.
 * Ensures the patch payload is structurally valid before any
 * Eloquent write touches the pre-built sku_inventory table.
 */
class PatchDatabaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Explicit user action = authorized
    }

    public function rules(): array
    {
        return [
            'patch_id'              => ['required', 'string', 'uuid'],
            'target_category'       => ['required', 'string', 'max:100'],
            'payload'               => ['required', 'array'],
            'payload.tax_tier'      => ['required', 'numeric', 'min:0', 'max:1'],
            'payload.margin_status' => ['sometimes', 'string', 'in:SECURED,OPTIMIZED,UNCHANGED'],
        ];
    }

    public function messages(): array
    {
        return [
            'patch_id.required'         => 'A valid patch_id is required to authorize the DB write.',
            'patch_id.uuid'             => 'The patch_id must be a valid UUID issued by the pipeline.',
            'target_category.required'  => 'A target_category (e.g. import-x) must be specified.',
            'payload.required'          => 'A payload array with tax_tier is required.',
            'payload.tax_tier.required' => 'The new tax_tier (e.g. 0.25 for 25%) is required.',
            'payload.tax_tier.min'      => 'Tax tier cannot be negative.',
            'payload.tax_tier.max'      => 'Tax tier cannot exceed 1.0 (100%).',
            'payload.margin_status.in'  => 'margin_status must be one of: SECURED, OPTIMIZED, UNCHANGED.',
        ];
    }
}
