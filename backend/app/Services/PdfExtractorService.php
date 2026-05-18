<?php
namespace App\Services;
use Smalot\PdfParser\Parser;
use Exception;

class PdfExtractorService
{
    public function extract(string $filePath): string
    {
        if (!file_exists($filePath)) {
            throw new Exception('PDF file not found.');
        }
        $parser = new Parser();
        $pdf = $parser->parseFile($filePath);
        $text = $pdf->getText();
        $text = preg_replace('/\s+/', ' ', $text);
        return substr(trim($text), 0, 5000);
    }
}
