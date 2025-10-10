<?php
/**
 * Production Deployment Script
 * 
 * This script handles safe deployment of database changes to production.
 * It includes backup creation, migration execution, and rollback capabilities.
 */

require_once 'src/Database.php';
use App\Database;

class ProductionDeployer
{
    private $db;
    private $backupDir;
    private $config;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->backupDir = __DIR__ . '/backups/';
        $this->config = $this->loadConfig();
        
        // Create backup directory if it doesn't exist
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }

    /**
     * Load deployment configuration
     */
    private function loadConfig()
    {
        return [
            'database' => [
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'name' => $_ENV['DB_NAME'] ?? 'land_management',
                'user' => $_ENV['DB_USER'] ?? 'root',
                'pass' => $_ENV['DB_PASS'] ?? '',
                'port' => $_ENV['DB_PORT'] ?? 3306,
            ],
            'backup' => [
                'retention_days' => 30, // Keep backups for 30 days
                'compress' => true,     // Compress backup files
            ]
        ];
    }

    /**
     * Create a database backup
     */
    public function createBackup($label = null)
    {
        $timestamp = date('Y-m-d_H-i-s');
        $label = $label ? "_{$label}" : '';
        $filename = "backup_{$timestamp}{$label}.sql";
        $filepath = $this->backupDir . $filename;

        echo "Creating database backup...\n";
        echo "Backup file: {$filename}\n";

        // Use mysqldump to create backup
        $cmd = sprintf(
            'mysqldump -h%s -P%s -u%s -p%s --single-transaction --routines --triggers %s > %s',
            escapeshellarg($this->config['database']['host']),
            escapeshellarg($this->config['database']['port']),
            escapeshellarg($this->config['database']['user']),
            escapeshellarg($this->config['database']['pass']),
            escapeshellarg($this->config['database']['name']),
            escapeshellarg($filepath)
        );

        $result = shell_exec($cmd . ' 2>&1');
        
        if (!file_exists($filepath) || filesize($filepath) === 0) {
            throw new Exception("Backup creation failed: {$result}");
        }

        // Compress backup if enabled
        if ($this->config['backup']['compress']) {
            $this->compressBackup($filepath);
            $filepath .= '.gz';
        }

        echo "✓ Backup created successfully: " . basename($filepath) . "\n";
        echo "Size: " . $this->formatBytes(filesize($filepath)) . "\n";
        
        return $filepath;
    }

    /**
     * Compress a backup file
     */
    private function compressBackup($filepath)
    {
        $cmd = "gzip {$filepath}";
        shell_exec($cmd);
    }

    /**
     * Run database migrations safely
     */
    public function deploy($createBackup = true, $backupLabel = null)
    {
        echo "Starting production deployment...\n";
        echo "================================\n\n";

        try {
            // Step 1: Create backup
            if ($createBackup) {
                $backupFile = $this->createBackup($backupLabel);
                echo "\n";
            }

            // Step 2: Run migrations
            echo "Running database migrations...\n";
            require_once 'database/migrate.php';
            $manager = new MigrationManager();
            $manager->migrate();

            // Step 3: Verify deployment
            echo "\nVerifying deployment...\n";
            $this->verifyDeployment();

            echo "\n✓ Production deployment completed successfully!\n";
            
            if ($createBackup) {
                echo "Backup file: " . basename($backupFile) . "\n";
            }

        } catch (Exception $e) {
            echo "\n✗ Deployment failed: " . $e->getMessage() . "\n";
            echo "\nIf you need to rollback, you can restore from the backup:\n";
            if ($createBackup && isset($backupFile)) {
                echo "mysql -h{$this->config['database']['host']} -u{$this->config['database']['user']} -p{$this->config['database']['pass']} {$this->config['database']['name']} < {$backupFile}\n";
            }
            exit(1);
        }
    }

    /**
     * Verify deployment success
     */
    private function verifyDeployment()
    {
        // Check if all expected tables exist
        $expectedTables = [
            'users',
            'lands', 
            'email_templates',
            'navigation_menus',
            'password_tokens',
            'endpoint_permissions',
            'schema_migrations'
        ];

        foreach ($expectedTables as $table) {
            $result = $this->db->fetchOne("SHOW TABLES LIKE ?", [$table]);
            if (!$result) {
                throw new Exception("Table '{$table}' not found after migration");
            }
        }

        echo "✓ All expected tables exist\n";
        echo "✓ Database schema is valid\n";
    }

    /**
     * Clean up old backups
     */
    public function cleanupBackups()
    {
        echo "Cleaning up old backups...\n";
        
        $files = glob($this->backupDir . 'backup_*.sql*');
        $cutoffTime = time() - ($this->config['backup']['retention_days'] * 24 * 60 * 60);
        
        $deletedCount = 0;
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                $deletedCount++;
                echo "Deleted old backup: " . basename($file) . "\n";
            }
        }

        echo "✓ Cleaned up {$deletedCount} old backup files\n";
    }

    /**
     * List available backups
     */
    public function listBackups()
    {
        echo "Available Backups:\n";
        echo "=================\n\n";

        $files = glob($this->backupDir . 'backup_*.sql*');
        rsort($files); // Sort by newest first

        if (empty($files)) {
            echo "No backup files found.\n";
            return;
        }

        foreach ($files as $file) {
            $size = $this->formatBytes(filesize($file));
            $date = date('Y-m-d H:i:s', filemtime($file));
            $filename = basename($file);
            
            echo sprintf("%-40s %s %s\n", $filename, $size, $date);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Restore from backup
     */
    public function restore($backupFile)
    {
        $fullPath = $this->backupDir . $backupFile;
        
        if (!file_exists($fullPath)) {
            throw new Exception("Backup file not found: {$backupFile}");
        }

        echo "Restoring from backup: {$backupFile}\n";
        echo "WARNING: This will overwrite the current database!\n";
        echo "Are you sure? (yes/no): ";
        
        $handle = fopen("php://stdin", "r");
        $response = trim(fgets($handle));
        fclose($handle);
        
        if (strtolower($response) !== 'yes') {
            echo "Restore cancelled.\n";
            return;
        }

        // Create a backup before restore
        $this->createBackup('before_restore');

        // Restore the database
        $cmd = sprintf(
            'mysql -h%s -P%s -u%s -p%s %s < %s',
            escapeshellarg($this->config['database']['host']),
            escapeshellarg($this->config['database']['port']),
            escapeshellarg($this->config['database']['user']),
            escapeshellarg($this->config['database']['pass']),
            escapeshellarg($this->config['database']['name']),
            escapeshellarg($fullPath)
        );

        $result = shell_exec($cmd . ' 2>&1');
        
        if ($result && !empty(trim($result))) {
            echo "Restore completed with warnings:\n{$result}\n";
        } else {
            echo "✓ Database restored successfully from {$backupFile}\n";
        }
    }
}

// CLI Interface
if (php_sapi_name() === 'cli') {
    $command = $argv[1] ?? 'help';
    $deployer = new ProductionDeployer();

    switch ($command) {
        case 'deploy':
            $backup = ($argv[2] ?? 'true') === 'true';
            $label = $argv[3] ?? null;
            $deployer->deploy($backup, $label);
            break;
            
        case 'backup':
            $label = $argv[2] ?? null;
            $deployer->createBackup($label);
            break;
            
        case 'restore':
            $backupFile = $argv[2] ?? null;
            if (!$backupFile) {
                echo "Usage: php deploy.php restore <backup_file>\n";
                exit(1);
            }
            $deployer->restore($backupFile);
            break;
            
        case 'list':
            $deployer->listBackups();
            break;
            
        case 'cleanup':
            $deployer->cleanupBackups();
            break;
            
        case 'help':
        default:
            echo "Production Deployment Manager\n";
            echo "============================\n\n";
            echo "Commands:\n";
            echo "  deploy [backup] [label]  - Deploy with optional backup (default: true)\n";
            echo "  backup [label]           - Create a database backup\n";
            echo "  restore <file>           - Restore from backup file\n";
            echo "  list                     - List available backups\n";
            echo "  cleanup                  - Clean up old backups\n";
            echo "  help                     - Show this help\n";
            echo "\nExamples:\n";
            echo "  php deploy.php deploy                    # Deploy with backup\n";
            echo "  php deploy.php deploy false              # Deploy without backup\n";
            echo "  php deploy.php deploy true v2.1.0       # Deploy with labeled backup\n";
            echo "  php deploy.php backup pre_release       # Create labeled backup\n";
            echo "  php deploy.php restore backup_2024-01-15.sql.gz\n";
            break;
    }
}
?>
