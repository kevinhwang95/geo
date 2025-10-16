<?php
/**
 * Migration script to remove payment-related columns from work_completion_workers table
 * This simplifies the table to only store worker IDs for work completion tracking
 */

require_once __DIR__ . '/src/Database.php';

use App\Database;

try {
    $db = Database::getInstance();
    
    echo "Starting migration to remove payment columns from work_completion_workers table...\n";
    
    // Check if table exists
    $checkTable = $db->query("SHOW TABLES LIKE 'work_completion_workers'");
    if (empty($checkTable)) {
        echo "Table work_completion_workers does not exist. Creating simplified table...\n";
        
        $createTable = "
            CREATE TABLE work_completion_workers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                completion_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (completion_id) REFERENCES work_completions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_completion_user (completion_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        $db->query($createTable);
        echo "Created simplified work_completion_workers table.\n";
        
    } else {
        echo "Table exists. Removing payment-related columns...\n";
        
        // Remove payment-related columns
        $alterQueries = [
            "ALTER TABLE work_completion_workers DROP COLUMN IF EXISTS hours_worked",
            "ALTER TABLE work_completion_workers DROP COLUMN IF EXISTS hourly_rate", 
            "ALTER TABLE work_completion_workers DROP COLUMN IF EXISTS total_payment",
            "ALTER TABLE work_completion_workers DROP COLUMN IF EXISTS notes"
        ];
        
        foreach ($alterQueries as $query) {
            try {
                $db->query($query);
                echo "Executed: $query\n";
            } catch (Exception $e) {
                echo "Warning: $query failed - " . $e->getMessage() . "\n";
            }
        }
        
        // Add created_at column if it doesn't exist
        try {
            $db->query("ALTER TABLE work_completion_workers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            echo "Added created_at column.\n";
        } catch (Exception $e) {
            echo "created_at column already exists or failed to add: " . $e->getMessage() . "\n";
        }
        
        // Add unique constraint if it doesn't exist
        try {
            $db->query("ALTER TABLE work_completion_workers ADD CONSTRAINT unique_completion_user UNIQUE (completion_id, user_id)");
            echo "Added unique constraint.\n";
        } catch (Exception $e) {
            echo "Unique constraint already exists or failed to add: " . $e->getMessage() . "\n";
        }
    }
    
    // Show final table structure
    echo "\nFinal table structure:\n";
    $structure = $db->query("DESCRIBE work_completion_workers");
    foreach ($structure as $column) {
        echo "- {$column['Field']}: {$column['Type']}\n";
    }
    
    echo "\nMigration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
