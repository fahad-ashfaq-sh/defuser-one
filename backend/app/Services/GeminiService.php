<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private array $connections;

    public function __construct()
    {
        $this->connections = [
            [
                'api_key'  => config('services.gemini.api_key'),
                'base_url' => config('services.gemini.base_url'),
            ],
            [
                'api_key'  => config('services.gemini.api_key_2'),
                'base_url' => config('services.gemini.base_url_2'),
            ],
            [
                'api_key'  => config('services.gemini.api_key_3'),
                'base_url' => config('services.gemini.base_url_3'),
            ],
        ];
    }

    public function generate(string $prompt, bool $isJson = false, ?string $systemInstruction = null): ?string
    {
        $payload = [
            'contents'         => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature'     => 0.1,   // Low temp = faster, deterministic JSON
                'maxOutputTokens' => 4096,  // Sufficient for our structured schema
            ],
        ];

        if ($systemInstruction) {
            $payload['system_instruction'] = [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ];
        }

        // Agar JSON chahiye, to Gemini ko strictly JSON format mein reply karne ka bolo
        if ($isJson) {
            $payload['generationConfig']['responseMimeType'] = 'application/json';
        }

        foreach ($this->connections as $index => $connection) {
            if (empty($connection['api_key']) || empty($connection['base_url'])) {
                continue; // Skip unconfigured endpoints
            }

            $apiKey = $connection['api_key'];
            $baseUrl = $connection['base_url'];
            $attemptNum = $index + 1;

            Log::info("GeminiService: Attempting API call with connection #{$attemptNum}");

            $response = Http::timeout(110)->post("{$baseUrl}?key={$apiKey}", $payload);

            if ($response->successful()) {
                // Return the text directly on success
                return $response->json('candidates.0.content.parts.0.text', '{}');
            }

            $statusCode = $response->status();
            Log::warning("Gemini API error [{$statusCode}] on connection #{$attemptNum}: " . $response->body());
            
            // Loop continues to next configured fallback connection
        }

        Log::error("GeminiService: All configured API connections failed.");
        // Return null to signal a hard API failure after all fallbacks exhausted
        return null;
    }

    public function generateJson(string $prompt, ?string $systemInstruction = null): array
    {
        // Yahan $isJson ko true bhej rahe hain taake Gemini officially perfect JSON de
        $result = $this->generate($prompt, true, $systemInstruction);

        // null means the API returned a hard error (429/403/401) — treat as empty result
        if ($result === null) {
            Log::warning('Gemini generateJson: API call failed (null returned). Returning empty array.');
            return [];
        }

        $decoded = json_decode(trim($result), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Error reason log karo
            Log::error("Gemini JSON Parsing failed", [
                'error'      => json_last_error_msg(),
                'raw_result' => $result
            ]);
            return [];
        }
        Log::info("Gemini JSON Parsing success", ['decoded' => $decoded]);
        return $decoded;
    }
}
