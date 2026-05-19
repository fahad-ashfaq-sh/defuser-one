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

        // --- STAGE 2: Keyword Synonym Fallback Engine (Secondary) ---
        // Gemini failed (429/403/401) — use semantic keyword mapping on raw prose.
        Log::warning('DocumentIngestAgent: AI returned empty tariffTable. Engaging Keyword Synonym Fallback Engine.');

        $tariffTable = [];

        // Live Database se verified slugs ka array nikalna (context grounding)
        $liveDbSlugs = SkuInventory::distinct()->pluck('category_slug')->toArray();

        // Debug: log a snippet of raw text so we can see what the fallback engine receives
        Log::debug('DocumentIngestAgent: Fallback raw_text snippet.', [
            'first_800_chars' => mb_substr($rawText, 0, 800),
            'live_db_slugs'   => $liveDbSlugs,
        ]);

        // ─────────────────────────────────────────────────────────────────────
        // KEYWORD SYNONYM MAP: English natural-language terms → DB slug
        //
        // Strategy: Find every percentage in the document. For each one, examine
        // a 350-char window of surrounding context. Check that window against
        // this keyword map. Any match that resolves to a live DB slug → threat row.
        //
        // Add/expand keywords here as new document types are encountered.
        // ─────────────────────────────────────────────────────────────────────
        $synonymMap = [
    // ── smart-devices ───────────────────────────────────────────────
    'smart-devices' => [
        'smart device', 'smart home', 'iot', 'smart lock', 'thermostat', 
        'smoke detector', 'air purifier', 'smart plug', 'doorbell pro', 'surveillance camera'
    ],
    // ── consumer-electronics ────────────────────────────────────────
    'consumer-electronics' => [
        'consumer electronic', 'electronics', 'electronic goods', 'television', 'tv', 
        'audio', 'video', 'speaker', 'soundbar', 'projector', 'photo frame', 'headphones', 'earbuds'
    ],
    // ── computer-peripherals ────────────────────────────────────────
    'computer-peripherals' => [
        'computer peripheral', 'peripheral', 'keyboard', 'mouse', 'docking station', 
        'adapter', 'external ssd', 'dvd writer', 'monitor stand', 'screen filter'
    ],
    // ── telecom-equipment ───────────────────────────────────────────
    'telecom-equipment' => [
        'telecom', 'telecommunication', 'telecom equipment', 'pbx', 'voip', 
        'doorphone', 'gsm gateway', 'conference phone', 'intercom', 'paging system'
    ],
    // ── imported-accessories ────────────────────────────────────────
    'imported-accessories' => [
        'accessory', 'accessories', 'imported accessory', 'laptop bag', 'cooling pad', 
        'cable organizer', 'phone stand', 'smart watch band', 'charging pad', 'mouse pad xl'
    ],
    // ── networking-equipment ────────────────────────────────────────
    'networking-equipment' => [
        'networking', 'network equipment', 'router', 'switch', 'ups', 'firewall', 
        'access point', 'media converter', 'ethernet extender', 'bridge kit', 'rack cabinet'
    ],
    // ── office-electronics ──────────────────────────────────────────
    'office-electronics' => [
        'office electronic', 'office equipment', 'printer', 'shredder', 'laminator', 
        'whiteboard', 'label printer', 'binding machine', 'document scanner', 'conferencing camera'
    ],
    // ── mobile-devices ──────────────────────────────────────────────
    'mobile-devices' => [
        'mobile', 'smartphone', 'smart phone', 'cell phone', 'tablet', '5g tablet', 
        'charger', 'fast charger', 'phone case', 'power bank', 'ring light', 'foldable keyboard'
    ],
    // ── gaming-hardware ─────────────────────────────────────────────
    'gaming-hardware' => [
        'gaming', 'gaming hardware', 'gaming console', 'gaming chair', 'gaming keyboard', 
        'gaming mouse', 'gaming router', 'gaming monitor', 'capture card', 'gaming desktop'
    ],
    // ── luxury-imports ──────────────────────────────────────────────
    'luxury-imports' => [
        'luxury', 'luxuries', 'luxury item', 'luxury good', 'luxury import',
        'premium import', 'high-end', 'high end', 'luxury product', 'luxury goods',
        'luxury smartwatch', 'luxury appliance', 'premium goods'
    ]
];

        // STEP 1: Extract all percentage mentions with their positions in the text
        $textLower = mb_strtolower($rawText);
        preg_match_all('/([\d]{1,3}(?:\.[\d]{1,2})?)\s*(?:percent|%)/i', $rawText, $pctMatches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER);

        $seen = [];
        foreach ($pctMatches as $pctMatch) {
            $rate   = (float) $pctMatch[1][0];
            $offset = (int)   $pctMatch[0][1];

            // Sanity: skip obviously wrong rates
            if ($rate <= 0 || $rate > 100) {
                continue;
            }

            // STEP 2: Extract a 350-char context window centred around this percentage
            $windowStart   = max(0, $offset - 200);
            $windowLen     = min(350, mb_strlen($textLower) - $windowStart);
            $contextWindow = mb_substr($textLower, $windowStart, $windowLen);

            // STEP 3: Scan context window against every keyword in the synonym map
            foreach ($synonymMap as $slug => $keywords) {
                // Skip slugs that are not in the live DB (safety guard)
                if (!in_array($slug, $liveDbSlugs)) {
                    continue;
                }

                foreach ($keywords as $keyword) {
                    // Use word-boundary matching so 'import' won't fire on 'importers',
                    // 'tv' won't fire on 'activity', 'food' won't fire on 'foodstuffs', etc.
                    $pattern = '/\b' . preg_quote(mb_strtolower($keyword), '/') . '\b/u';
                    if (preg_match($pattern, $contextWindow)) {
                        // Keyword hit — verify and record
                        $dedupeKey = $slug . ':' . $rate;
                        if (!isset($seen[$dedupeKey])) {
                            $seen[$dedupeKey] = true;
                            $tariffTable[] = [
                                'category_slug' => $slug,
                                'tax_rate'      => $rate / 100,
                            ];
                            Log::info("Keyword Fallback: slug='{$slug}' matched via keyword='{$keyword}' at rate={$rate}%.");
                        }
                        break; // One keyword match per slug per percentage is enough
                    }
                }
            }
        }

        // STEP 4 (Last resort): If still no threats and the document mentions ANY percentage,
        // run the original structured HS-code regex as a final structured-format sweep.
        if (empty($tariffTable)) {
            Log::warning('Keyword Fallback: No keyword matches. Running structured HS-code pattern sweep.');
            if (preg_match_all('/HS-\d{4}\s*[\|\-]\s*([\w\-]+)\s*[\|\-]\s*([\d.]+)\s*%/i', $rawText, $hsMatches, PREG_SET_ORDER)) {
                foreach ($hsMatches as $m) {
                    $slug = strtolower(trim($m[1]));
                    $rate = (float) $m[2];
                    if (in_array($slug, $liveDbSlugs) && $rate > 0 && $rate <= 100) {
                        $dedupeKey = $slug . ':' . $rate;
                        if (!isset($seen[$dedupeKey])) {
                            $seen[$dedupeKey] = true;
                            $tariffTable[] = ['category_slug' => $slug, 'tax_rate' => $rate / 100];
                            Log::info("HS-Code Fallback: slug='{$slug}' rate={$rate}%.");
                        }
                    }
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

