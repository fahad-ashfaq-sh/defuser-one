<?php

namespace App\Services\Agents;

use App\Models\SkuInventory;
use App\Services\PdfExtractorService;
use App\Services\PromptService;
use Illuminate\Support\Facades\Log;

class DocumentIngestAgent
{
    public function __construct(private PdfExtractorService $pdfExtractor, private PromptService $promptService) {}

    public function run(?string $pdfPath = null, ?string $rawTextInput = null): array
    {
        // --- STAGE 1: Intake & Extraction ---
        if ($pdfPath) {
            $binaryContent   = file_get_contents($pdfPath);
            $threatReference = hash('sha256', $binaryContent);
            $rawText = $this->pdfExtractor->extract($pdfPath);
        } else {
            // Direct raw text bypass
            $threatReference = hash('sha256', $rawTextInput);
            $rawText = $rawTextInput;
        }

        // --- STAGE 2: AI Path (Primary) ---
        // PromptService returns an array. If Gemini succeeds, tariffTable will be populated.
        // We check the tariffTable array itself, not the wrapping array, to detect API failure.
        $Api_response = $this->promptService->run($rawText);

        if (!empty($Api_response['tariffTable'])) {
            // AI path succeeded — attach traceability fields and return the FULL multi-threat payload
            Log::info('DocumentIngestAgent: AI extraction succeeded.', [
                'threat_count' => count($Api_response['tariffTable'])
            ]);
            $Api_response['threatReference'] = $threatReference;
            $Api_response['raw_text']        = $rawText;
            return $Api_response;
        }

        // --- STAGE 2: Regex Fallback (Secondary) ---
        // API returned an empty tariffTable or failed entirely — use regex grounding engine.
        Log::warning('DocumentIngestAgent: AI returned empty tariffTable. Engaging Regex Fallback Engine.');

        $tariffTable = [];

        // Live Database se verified slugs ka array nikalna (context grounding)
        $liveDbSlugs = SkuInventory::distinct()->pluck('category_slug')->toArray();

        // Global match sweeps the entire text for ALL rows matching "HS-XXXX | Category | XX%"
        if (preg_match_all('/HS-\d{4}\s*[\|\-]\s*([\w\-]+)\s*[\|\-]\s*([\d.]+)\%/i', $rawText, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                $extractedSlug = strtolower(trim($m[1]));

                // CRITICAL CHECK: Only accept slugs that exactly exist in the live DB
                if (in_array($extractedSlug, $liveDbSlugs)) {
                    // Append each verified row — never overwrite the collection
                    $tariffTable[] = [
                        'category_slug' => $extractedSlug,
                        'tax_rate'      => (float) $m[2] / 100,
                    ];
                } else {
                    Log::warning("Regex Fallback: Slug '{$extractedSlug}' not in live DB. Skipped to prevent corruption.");
                }
            }
        }

        // Strip tariff rows from prose for the legal text field
        $legalProse = preg_replace('/HS-\d{4}\s*[\|\-]\s*[\w\-]+\s*[\|\-]\s*[\d.]+(?:\s*)?%/i', '', $rawText);

        Log::info('DocumentIngestAgent: Regex Fallback complete.', [
            'threats_found' => count($tariffTable)
        ]);

        // Return the full MULTI-THREAT tariffTable array — never compressed to a single item
        return [
            'threatReference'    => $threatReference,
            'action_summary'     => 'Action summary not available (Regex Fallback).',
            'executive_summary'  => 'Executive summary not available (Regex Fallback).',
            'terminal_trace_log' => 'Terminal trace log not available (Regex Fallback).',
            'legalProse'         => trim($legalProse),
            'tariffTable'        => $tariffTable,
            'raw_text'           => $rawText,
        ];
    }
}

