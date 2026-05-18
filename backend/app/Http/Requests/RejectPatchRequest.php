<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectPatchRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patch_id'        => 'required|string|uuid',
            'reject_reason'   => 'sometimes|string|max:500',
        ];

    }
    public function messages(): array
{
    return [
        'patch_id.required' => 'Patch ID is required to reject a patch.',
        'patch_id.uuid'     => 'Patch ID must be a valid UUID.',
        'reject_reason.max' => 'Reject reason cannot exceed 500 characters.',
    ];
}

}