<?php
namespace App\Services;

use App\Models\SkuInventory;
use Illuminate\Support\Facades\Log;

class PromptService
{
    public function __construct(private GeminiService $gemini) {}

    public function run(string $rawText): array
    {
        $start = microtime(true);

        // Fetch live verified slugs for context grounding
        $allowedSlugsList = implode(', ', SkuInventory::distinct()->pluck('category_slug')->toArray());

        // --- SYSTEM INSTRUCTION: Rules, Identity, and Schema ---
        $systemInstruction = <<<SYSTEM
You are the DocumentIngestAgent and Fiscal Regulatory Parser for Project Defuser One.
Your mission is to process the following raw, unstructured statutory text extracted from an official Federal Board of Revenue (FBR) regulatory circular.

TASK:
Isolate and extract explicit compliance constraints, target category parameters, and tax adjustments. You must map these parameters cleanly so they can match our database schema targets.

CRITICAL GROUNDING & MAPPING CONTRACT:
1. You are strictly FORBIDDEN from inventing, generating, or guessing new category names or slug strings.
2. For every item you extract inside the "tariffTable", the "category_slug" value MUST be an exact string match from this specific live database list: [{$allowedSlugsList}].
3. Semantic Rule: If the text discusses general items like juices, drinks, chocolates, or packaged food, evaluate which slug from the provided list fits best semantically (e.g., if 'imported-food-beverage-customs-duty-max' is in the list, use it). Never add extensions like '-max' or '-products' unless it is explicitly present in the list above.
4. If a tax change mentioned in the document does not map to ANY slug in the provided list, skip that specific item from the "tariffTable" to prevent data corruption.
5. MULTI-THREAT EXTRACTION: You MUST extract ALL matching tariff rows found in the document. Do NOT stop after the first or highest severity entry.

CRITICAL RULE (OVERALL DOCUMENT SUMMARIZATION & LATENCY OPTIMIZATION):
The "action_summary", "executive_summary", and "terminal_trace_log" MUST be generated exactly ONCE for the entire provided text. Keep descriptions hyper-concise, technical, and high-density to minimize token generation time while maintaining absolute data accuracy.

You MUST return a JSON object following this exact schema structure:
{
  "effective_date": "ISO 8601 format date (YYYY-MM-DD) found in the enforcement or activation clauses. If completely absent, default to the upcoming fiscal quarter start",
  "action_summary": "CRITICAL: Max 15-20 words. A single, direct operational command explaining the immediate compliance action required.",
  "executive_summary": "CRITICAL: Max 2-3 sharp, dense sentences summarizing the document's core fiscal updates and overall impact. Zero filler text.",
  "terminal_trace_log": "CRITICAL: A single dense string containing 4-5 short chronological execution steps formatted strictly as [1/4] Step... [2/4] Step... Max 10 words per step to minimize response latency.",
  "tariffTable": [
    {
      "category_slug": "MUST be an exact matched string from the allowed database list provided above. No exceptions.",
      "tax_rate": "The new applied tax rate expressed strictly as a decimal float multiplier (e.g., 25% must be parsed as 0.25, 18.5% must be parsed as 0.185)"
    }
  ],
  "legalProse": "A clean, aggregated string containing only high-severity regulatory compliance text, enforcement conditions, or penalty notices found in the document context for our logging engine."
}
SYSTEM;

        // --- USER PROMPT: Just the text to analyze ---
        $prompt = <<<PROMPT
TEXT TO ANALYZE:
{$rawText}
PROMPT;

        $result = $this->gemini->generateJson($prompt, $systemInstruction);

        Log::info('DocumentIngestAgent: Gemini extraction complete.', [
            'duration_ms'  => (int)((microtime(true) - $start) * 1000),
            'threat_count' => count($result['tariffTable'] ?? []),
        ]);

        return [
            'agent'              => 'DocumentIngestAgent',
            'effective_date'     => $result['effective_date']     ?? now()->addMonths(1)->startOfMonth()->toDateString(),
            'action_summary'     => $result['action_summary']     ?? 'Action summary not available.',
            'executive_summary'  => $result['executive_summary']  ?? 'Executive summary not available.',
            'terminal_trace_log' => $result['terminal_trace_log'] ?? 'Terminal trace log not available.',
            'tariffTable'        => $result['tariffTable']        ?? [],
            'legalProse'         => $result['legalProse']         ?? 'Statutory syntax extracted.',
            'duration_ms'        => (int)((microtime(true) - $start) * 1000),
        ];
    }
}