<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * AgentTraceWriter
 *
 * Writes structured JSON proof-of-logic trace files to:
 * /storage/app/agent_traces/{trace_id}.json
 *
 * These files serve as inspectable evidence of agentic reasoning
 * for the AI Seekho 2026 evaluation panel.
 */
class AgentTraceWriter
{
    private const TRACE_DIR = 'agent_traces';

    /**
     * Write a trace payload to a dedicated JSON file.
     *
     * @param  string $traceId  UUID used as filename
     * @param  array  $payload  Full pipeline trace data
     * @return string           Absolute path to the written file
     */
    public function write(string $traceId, array $payload): string
    {
        $filename = self::TRACE_DIR . "/{$traceId}.json";

        Storage::disk('local')->put(
            $filename,
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        return storage_path("app/{$filename}");
    }

    /**
     * Read an existing trace file by its ID.
     *
     * @param  string $traceId
     * @return array|null
     */
    public function read(string $traceId): ?array
    {
        $filename = self::TRACE_DIR . "/{$traceId}.json";

        if (! Storage::disk('local')->exists($filename)) {
            return null;
        }

        return json_decode(Storage::disk('local')->get($filename), true);
    }
}
