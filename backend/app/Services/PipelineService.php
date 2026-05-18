<?php
namespace App\Services;

use App\Services\Agents\DocumentIngestAgent;
use App\Services\Agents\FiscalThreatAnalyzer;
use App\Services\Agents\DatabasePatchAgent;


class PipelineService
{

    public function __construct(
        private DocumentIngestAgent  $ingestAgent,
        private FiscalThreatAnalyzer $threatAnalyzer,
        private DatabasePatchAgent   $patchAgent,
    ) {
    }

    public function run(?string $fullPath = null, ?string $rawText = null): array
    {
        // Stage 1 + Stage 2
        $ingestPayload = $this->ingestAgent->run($fullPath, $rawText);

        if (empty($ingestPayload['tariffTable'])) {
            return [
                'status' => 'early_exit',
                'response' => [
                    'pipeline_status' => 'NO_THREAT_DETECTED',
                    'ui_directive'    => 'MAINTAIN_CORPORATE_GREEN',
                    'message'         => 'No structured tariff rows found in the uploaded document.',
                    'threat_reference' => $ingestPayload['threatReference'],
                ]
            ];
        }

        // --- S3 & S4: Fiscal metrics + leakage calculation ---
        $threatPayload = $this->threatAnalyzer->run($ingestPayload);

        // --- S5: Deterministic JSON patch formulation (DB NOT TOUCHED) ---
        $patchPayload = $this->patchAgent->formulate($ingestPayload, $threatPayload);

        return [
            'status'        => 'success',
            'ingestPayload' => $ingestPayload,
            'threatPayload' => $threatPayload,
            'patchPayload'  => $patchPayload,
        ];
    }
}