<?php

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    echo "Dotenv parsing warning: " . $e->getMessage() . "\n";
}

use App\Database;
use App\WorkNote;

echo "Testing photo data structure...\n";

$workNote = new WorkNote();

// Test formatting work note with photos
echo "\n1. Testing formatWorkNote with photos...\n";
try {
    $note = $workNote->findById(6); // Use note ID 6 which has photos
    if ($note) {
        $formatted = $workNote->formatWorkNote($note, true); // Include photos
        echo "✓ Formatted work note:\n";
        echo "  - ID: {$formatted['id']}\n";
        echo "  - Title: {$formatted['title']}\n";
        echo "  - Photos count: " . (isset($formatted['photos']) ? count($formatted['photos']) : 0) . "\n";
        
        if (isset($formatted['photos']) && count($formatted['photos']) > 0) {
            echo "  - Photos data structure:\n";
            foreach ($formatted['photos'] as $i => $photo) {
                echo "    Photo $i:\n";
                echo "      - id: " . ($photo['id'] ?? 'missing') . "\n";
                echo "      - filename: " . ($photo['filename'] ?? 'missing') . "\n";
                echo "      - file_path: " . ($photo['file_path'] ?? 'missing') . "\n";
                echo "      - mime_type: " . ($photo['mime_type'] ?? 'missing') . "\n";
                echo "      - url: " . (isset($photo['url']) ? $photo['url'] : 'missing') . "\n";
                echo "      - constructed_url: /uploads/photos/" . ($photo['filename'] ?? 'missing') . "\n";
            }
        }
        
        // Output JSON for frontend testing
        echo "\n2. JSON output for frontend:\n";
        echo json_encode($formatted, JSON_PRETTY_PRINT) . "\n";
        
    } else {
        echo "ℹ Work note ID 6 not found\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\nPhoto data structure test completed!\n";
?>


