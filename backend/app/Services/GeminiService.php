<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $baseUrl;
    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->baseUrl = config('services.gemini.base_url');
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

        $response = Http::timeout(110)->post("{$this->baseUrl}?key={$this->apiKey}", $payload);

        if (!$response->successful()) {
            $statusCode = $response->status();
            Log::error("Gemini API error [{$statusCode}]: " . $response->body());
            // Return null to signal a hard API failure (429/403/401) — callers must handle null
            return null;
        }

        // Return the text directly
        return $response->json('candidates.0.content.parts.0.text', '{}');
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
