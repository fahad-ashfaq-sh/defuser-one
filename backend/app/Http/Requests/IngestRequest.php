<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * IngestRequest — Validates POST /api/v1/directive/ingest
 *
 * Ensures the uploaded file is a valid PDF binary stream
 * before it is passed to the 7-Stage pipeline.
 */
class IngestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Open endpoint — authorization enforced at DB write stage
    }

    public function rules(): array
    {
        return [
            'pdf'      => ['required_without:raw_text', 'file', 'mimes:pdf', 'max:20480'], // Max 20MB
            'raw_text' => ['required_without:pdf', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'pdf.required_without'      => 'You must provide either a regulatory PDF or raw text data.',
            'raw_text.required_without' => 'You must provide either a regulatory PDF or raw text data.',
            'pdf.file'                  => 'The uploaded content must be a valid file.',
            'pdf.mimes'                 => 'Only PDF documents are accepted. Binary streams must be in .pdf format.',
            'pdf.max'                   => 'The uploaded PDF must not exceed 20MB.',
            'raw_text.string'           => 'The raw text must be a valid string.',
        ];
    }
}
