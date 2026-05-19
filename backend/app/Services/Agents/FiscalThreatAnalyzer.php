<?php

namespace App\Services\Agents;

use App\Models\SkuInventory;


class FiscalThreatAnalyzer
{
    private int $dailyRunRate;
    public function __construct()
    {
        $this->dailyRunRate = (int) env('SKU_DAILY_RUN_RATE', 100);
    }

    public function run(array $ingestPayload): array
    {
        $rawTariffTable = $ingestPayload['tariffTable'] ?? [];
        $effectiveDate  = $this->extractEffectiveDate($ingestPayload['legalProse'] ?? '');

        // Deduplicate tariff table by taking the maximum tax rate for each slug
        $deduplicatedTariff = [];
        foreach ($rawTariffTable as $row) {
            $slug = $row['category_slug'];
            $rate = (float) $row['tax_rate'];
            if (!isset($deduplicatedTariff[$slug]) || $rate > $deduplicatedTariff[$slug]['tax_rate']) {
                $deduplicatedTariff[$slug] = [
                    'category_slug' => $slug,
                    'tax_rate'      => $rate,
                ];
            }
        }
        $tariffTable = array_values($deduplicatedTariff);

        $slugs = array_column($tariffTable, 'category_slug');

        // SINGLE BULK QUERY: load all SKUs for all detected categories at once (eliminates N+1)
        $allSkus = SkuInventory::whereIn('category_slug', $slugs)->get()->groupBy('category_slug');

        $threats        = [];
        $reasoningChain = [];
        $totalLeakage   = 0.0;
        $totalSkus      = 0;

        // --- STAGE 3 & 4: Loop over ALL verified tariff rows ---
        foreach ($tariffTable as $tariffRow) {
            $taxTier      = (float) $tariffRow['tax_rate'];
            $categorySlug = $tariffRow['category_slug'];

            // Use in-memory grouped collection — no additional DB hit
            $affectedSkus = $allSkus->get($categorySlug, collect());

            // Calculate per-category daily leakage
            $categoryLeakage = $affectedSkus->sum(function (SkuInventory $sku) use ($taxTier) {
                // Only a rate INCREASE is a fiscal threat — clamp negative deltas to zero.
                // If new rate < applied rate, it's a tax cut, not a leakage event.
                $taxDelta       = max(0.0, $taxTier - (float) $sku->applied_tax_rate);
                $perUnitLeakage = (float) $sku->base_price * $taxDelta;
                return $perUnitLeakage * $this->dailyRunRate;
            });

            $totalLeakage += $categoryLeakage;
            $totalSkus    += $affectedSkus->count();

            $threats[] = [
                'tax_tier'             => $taxTier,
                'category_slug'        => $categorySlug,
                'daily_margin_leakage' => round($categoryLeakage, 2),
                'affected_sku_count'   => $affectedSkus->count(),
            ];

            $reasoningChain[] = [
                'step'        => 'ANALYZE_THREAT',
                'category'    => $categorySlug,
                'observation' => sprintf(
                    "Tariff row matched for category '%s' at %.0f%%. SkuInventory query returned %d records.",
                    $categorySlug, $taxTier * 100, $affectedSkus->count()
                ),
                'deduction'   => sprintf(
                    '$Daily_Margin_Leakage$ for "%s" = $%.2f (%.4f tax × %d units/day).',
                    $categorySlug, $categoryLeakage, $taxTier, $this->dailyRunRate
                ),
            ];
        }

        $reasoningChain[] = [
            'step'        => 'AGGREGATE_TOTALS',
            'observation' => sprintf('%d threat categories processed.', count($threats)),
            'deduction'   => sprintf('Total $Daily_Margin_Leakage$ = $%.2f across %d SKUs.', $totalLeakage, $totalSkus),
        ];

        // Return the primary threat fields for backward compatibility alongside the full multi-threat array
        $primaryThreat = collect($threats)->sortByDesc('daily_margin_leakage')->first()
            ?? ['category_slug' => 'unknown', 'tax_tier' => 0, 'daily_margin_leakage' => 0, 'affected_sku_count' => 0];

        return [
            // Single-threat fields (for DatabasePatchAgent backward compatibility)
            'tax_tier'             => $primaryThreat['tax_tier'],
            'category_slug'        => $primaryThreat['category_slug'],
            'effective_date'       => $effectiveDate,
            'daily_margin_leakage' => round($totalLeakage, 2),
            'affected_sku_count'   => $totalSkus,
            // Full multi-threat collection
            'threats'              => $threats,
            'reasoning_chain'      => $reasoningChain,
        ];
    }

    /**
     * Extracts effective date from legal prose.
     */
    private function extractEffectiveDate(string $prose): string
    {
        if (preg_match('/(?:effective\s+|DATE:\s*)(\d{4}-\d{2}-\d{2})/i', $prose, $m)) {
            return $m[1];
        }
        return now()->addMonths(1)->startOfMonth()->toDateString();
    }
}
