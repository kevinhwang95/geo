<?php
/**
 * Database Migration Manager
 * 
 * This script manages database migrations in a safe, production-ready way.
 * It tracks which migrations have been applied and ensures they run in order.
 */

require_once 'src/Database.php';
use App\Database;

class MigrationManager
{
    private $db;
    private $migrationsDir;
    private $migrationsTable = 'schema_migrations';

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->migrationsDir = __DIR__ . '/migrations/';
        
        // Ensure migrations table exists
        $this->createMigrationsTable();
    }

    /**
     * Create the migrations tracking table
     */
    private function createMigrationsTable()
    {
        $sql = "CREATE TABLE IF NOT EXISTS `{$this->migrationsTable}` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `migration` varchar(255) NOT NULL,
            `batch` int(11) NOT NULL,
            `executed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `migration` (`migration`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $this->db->query($sql);
    }

    /**
     * Get list of migration files
     */
    private function getMigrationFiles()
    {
        $files = glob($this->migrationsDir . '*.sql');
        sort($files);
        return $files;
    }

    /**
     * Get list of executed migrations
     */
    private function getExecutedMigrations()
    {
        $result = $this->db->fetchAll("SELECT migration FROM {$this->migrationsTable} ORDER BY batch, id");
        return array_column($result, 'migration');
    }

    /**
     * Get the next batch number
     */
    private function getNextBatch()
    {
        $result = $this->db->fetchOne("SELECT MAX(batch) as max_batch FROM {$this->migrationsTable}");
        return ($result['max_batch'] ?? 0) + 1;
    }

    /**
     * Execute a single migration file
     */
    private function executeMigration($filePath)
    {
        $migrationName = basename($filePath);
        echo "Executing migration: {$migrationName}\n";
        
        // Read the migration file
        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new Exception("Could not read migration file: {$filePath}");
        }

        // Split by semicolon and execute each statement
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($stmt) {
                return !empty($stmt) && !preg_match('/^--/', $stmt) && !preg_match('/^\/\*/', $stmt);
            }
        );

        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $this->db->query($statement);
            }
        }

        // Record the migration as executed
        $batch = $this->getNextBatch();
        $this->db->query(
            "INSERT INTO {$this->migrationsTable} (migration, batch) VALUES (?, ?)",
            [$migrationName, $batch]
        );

        echo "✓ Migration {$migrationName} completed successfully\n";
    }

    /**
     * Run all pending migrations
     */
    public function migrate()
    {
        echo "Starting database migration...\n";
        
        $migrationFiles = $this->getMigrationFiles();
        $executedMigrations = $this->getExecutedMigrations();
        
        $pendingMigrations = array_filter($migrationFiles, function($file) use ($executedMigrations) {
            return !in_array(basename($file), $executedMigrations);
        });

        if (empty($pendingMigrations)) {
            echo "No pending migrations found.\n";
            return;
        }

        echo "Found " . count($pendingMigrations) . " pending migrations:\n";
        foreach ($pendingMigrations as $file) {
            echo "  - " . basename($file) . "\n";
        }
        echo "\n";

        // Execute pending migrations
        foreach ($pendingMigrations as $file) {
            try {
                $this->executeMigration($file);
            } catch (Exception $e) {
                echo "✗ Migration failed: " . $e->getMessage() . "\n";
                echo "Rolling back is not automatic. Please check the database state.\n";
                exit(1);
            }
        }

        echo "\n✓ All migrations completed successfully!\n";
    }

    /**
     * Show migration status
     */
    public function status()
    {
        echo "Migration Status:\n";
        echo "================\n\n";

        $migrationFiles = $this->getMigrationFiles();
        $executedMigrations = $this->getExecutedMigrations();

        foreach ($migrationFiles as $file) {
            $migrationName = basename($file);
            $status = in_array($migrationName, $executedMigrations) ? '✓ EXECUTED' : '○ PENDING';
            echo sprintf("%-50s %s\n", $migrationName, $status);
        }

        echo "\n";
        echo "Total migrations: " . count($migrationFiles) . "\n";
        echo "Executed: " . count($executedMigrations) . "\n";
        echo "Pending: " . (count($migrationFiles) - count($executedMigrations)) . "\n";
    }

    /**
     * Create a new migration file
     */
    public function create($name)
    {
        $timestamp = date('Y_m_d_His');
        $filename = "{$timestamp}_{$name}.sql";
        $filepath = $this->migrationsDir . $filename;

        if (file_exists($filepath)) {
            echo "Migration file already exists: {$filename}\n";
            return;
        }

        $template = "-- Migration: {$name}\n-- Created: " . date('Y-m-d H:i:s') . "\n\n-- Add your migration SQL here\n";

        file_put_contents($filepath, $template);
        echo "Created new migration: {$filename}\n";
        echo "Edit the file to add your migration SQL.\n";
    }
}

// CLI Interface
if (php_sapi_name() === 'cli') {
    $command = $argv[1] ?? 'status';
    $manager = new MigrationManager();

    switch ($command) {
        case 'migrate':
            $manager->migrate();
            break;
        case 'status':
            $manager->status();
            break;
        case 'create':
            $name = $argv[2] ?? null;
            if (!$name) {
                echo "Usage: php migrate.php create <migration_name>\n";
                exit(1);
            }
            $manager->create($name);
            break;
        default:
            echo "Usage: php migrate.php [migrate|status|create <name>]\n";
            echo "\nCommands:\n";
            echo "  migrate     - Run all pending migrations\n";
            echo "  status      - Show migration status\n";
            echo "  create      - Create a new migration file\n";
            break;
    }
}
?>
