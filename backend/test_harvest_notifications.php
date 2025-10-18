<?php

/**
 * Test Script for Harvest Notification System
 * 
 * This script tests the harvest notification logic with sample data
 * and provides detailed output for debugging and verification.
 */

require_once 'vendor/autoload.php';
use Dotenv\Dotenv;
use App\Database;
use App\HarvestNotificationService;

// Load environment variables
try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Dotenv parsing warning: ' . $e->getMessage());
}

echo "=== Harvest Notification System Test ===\n";
echo "Test time: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = Database::getInstance();
    
    // Test 1: Check database structure
    echo "1. Testing Database Structure...\n";
    
    // Check if required tables exist
    $requiredTables = ['lands', 'plant_types', 'notifications', 'farm_works', 'work_types', 'work_categories'];
    foreach ($requiredTables as $table) {
        $exists = $db->fetchOne("SHOW TABLES LIKE '{$table}'");
        echo "   - Table '{$table}': " . ($exists ? "✅ EXISTS" : "❌ MISSING") . "\n";
    }
    
    // Check if required columns exist in lands table
    $landColumns = $db->fetchAll("DESCRIBE lands");
    $requiredLandColumns = ['previous_harvest_date', 'next_harvest_date'];
    foreach ($requiredLandColumns as $column) {
        $exists = array_filter($landColumns, fn($col) => $col['Field'] === $column);
        echo "   - Column 'lands.{$column}': " . (!empty($exists) ? "✅ EXISTS" : "❌ MISSING") . "\n";
    }
    
    // Check if plant_types table has harvest_cycle_days
    $plantTypeColumns = $db->fetchAll("DESCRIBE plant_types");
    $harvestCycleExists = array_filter($plantTypeColumns, fn($col) => $col['Field'] === 'harvest_cycle_days');
    echo "   - Column 'plant_types.harvest_cycle_days': " . (!empty($harvestCycleExists) ? "✅ EXISTS" : "❌ MISSING") . "\n";
    
    echo "\n";
    
    // Test 2: Check sample data
    echo "2. Testing Sample Data...\n";
    
    // Get lands with harvest data
    $landsWithHarvest = $db->fetchAll("
        SELECT 
            l.id, l.land_name, l.land_code, l.previous_harvest_date, l.next_harvest_date,
            pt.name as plant_type_name, pt.harvest_cycle_days
        FROM lands l
        LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
        WHERE l.is_active = 1 
        AND l.previous_harvest_date IS NOT NULL
        AND pt.harvest_cycle_days IS NOT NULL
        LIMIT 5
    ");
    
    echo "   - Lands with harvest data: " . count($landsWithHarvest) . "\n";
    
    if (!empty($landsWithHarvest)) {
        echo "   Sample lands:\n";
        foreach ($landsWithHarvest as $land) {
            $daysUntil = $land['next_harvest_date'] ? 
                (new DateTime($land['next_harvest_date']))->diff(new DateTime())->days : 'N/A';
            echo "     - {$land['land_name']} ({$land['land_code']}): {$land['plant_type_name']}, " .
                 "Previous: {$land['previous_harvest_date']}, Next: {$land['next_harvest_date']}, " .
                 "Cycle: {$land['harvest_cycle_days']} days, Days until: {$daysUntil}\n";
        }
    } else {
        echo "   ⚠️  No lands with harvest data found. You may need to:\n";
        echo "      - Add previous_harvest_date to lands\n";
        echo "      - Ensure plant_types have harvest_cycle_days set\n";
        echo "      - Check that lands are linked to plant_types\n";
    }
    
    echo "\n";
    
    // Test 3: Check work types for harvesting
    echo "3. Testing Work Types for Harvesting...\n";
    
    $harvestWorkTypes = $db->fetchAll("
        SELECT wt.id, wt.name, wc.name as category_name
        FROM work_types wt
        LEFT JOIN work_categories wc ON wt.category_id = wc.id
        WHERE LOWER(wt.name) LIKE '%harvest%' 
        OR LOWER(wc.name) LIKE '%harvest%'
    ");
    
    echo "   - Harvest work types found: " . count($harvestWorkTypes) . "\n";
    
    if (!empty($harvestWorkTypes)) {
        foreach ($harvestWorkTypes as $workType) {
            echo "     - {$workType['name']} (Category: {$workType['category_name']})\n";
        }
    } else {
        echo "   ⚠️  No harvest work types found. You may need to:\n";
        echo "      - Create work types with 'harvest' in the name\n";
        echo "      - Create work categories for harvesting\n";
    }
    
    echo "\n";
    
    // Test 4: Run harvest notification service (dry run)
    echo "4. Testing Harvest Notification Service...\n";
    
    $harvestService = new HarvestNotificationService();
    
    // Get lands that would be processed
    $landsToProcess = $db->fetchAll("
        SELECT 
            l.id, l.land_name, l.land_code, l.previous_harvest_date, l.next_harvest_date,
            pt.harvest_cycle_days, pt.name as plant_type_name
        FROM lands l
        LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
        WHERE l.is_active = 1 
        AND l.previous_harvest_date IS NOT NULL
        AND pt.harvest_cycle_days IS NOT NULL
        AND pt.harvest_cycle_days > 0
        LIMIT 3
    ");
    
    echo "   - Lands that would be processed: " . count($landsToProcess) . "\n";
    
    if (!empty($landsToProcess)) {
        echo "   Sample processing logic:\n";
        foreach ($landsToProcess as $land) {
            // Calculate next harvest date if not set
            $nextHarvestDate = $land['next_harvest_date'];
            if (empty($nextHarvestDate)) {
                $previousDate = new DateTime($land['previous_harvest_date']);
                $nextDate = clone $previousDate;
                $nextDate->add(new DateInterval("P{$land['harvest_cycle_days']}D"));
                $nextHarvestDate = $nextDate->format('Y-m-d');
            }
            
            // Calculate days until harvest
            $harvestDate = new DateTime($nextHarvestDate);
            $today = new DateTime();
            $today->setTime(0, 0, 0);
            $harvestDate->setTime(0, 0, 0);
            
            $daysUntilHarvest = $today->diff($harvestDate)->days;
            if ($today > $harvestDate) {
                $daysUntilHarvest = -$daysUntilHarvest; // Overdue
            }
            
            $priority = 'low';
            if ($daysUntilHarvest <= 0) {
                $priority = 'high'; // Overdue
            } elseif ($daysUntilHarvest == 1) {
                $priority = 'high'; // 1 day before
            } elseif ($daysUntilHarvest <= 3) {
                $priority = 'medium'; // 3 days before
            }
            
            echo "     - {$land['land_name']}: {$daysUntilHarvest} days until harvest → {$priority} priority\n";
            
            if ($daysUntilHarvest == 3) {
                echo "       → Would create farm work assignment\n";
            }
        }
    }
    
    echo "\n";
    
    // Test 5: Check existing notifications and farm works
    echo "5. Testing Existing Data...\n";
    
    $existingNotifications = $db->fetchAll("
        SELECT COUNT(*) as count, type, priority 
        FROM notifications 
        WHERE type = 'harvest' 
        GROUP BY type, priority
    ");
    
    echo "   - Existing harvest notifications:\n";
    if (!empty($existingNotifications)) {
        foreach ($existingNotifications as $notif) {
            echo "     - {$notif['type']} ({$notif['priority']}): {$notif['count']} notifications\n";
        }
    } else {
        echo "     - No harvest notifications found\n";
    }
    
    $existingFarmWorks = $db->fetchAll("
        SELECT COUNT(*) as count, status
        FROM farm_works 
        WHERE JSON_EXTRACT(metadata, '$.created_from') = 'harvest_notification'
        GROUP BY status
    ");
    
    echo "   - Existing harvest farm works:\n";
    if (!empty($existingFarmWorks)) {
        foreach ($existingFarmWorks as $work) {
            echo "     - {$work['status']}: {$work['count']} farm works\n";
        }
    } else {
        echo "     - No harvest farm works found\n";
    }
    
    echo "\n";
    
    // Test 6: Run actual harvest notification check (optional)
    echo "6. Run Harvest Notification Check? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    fclose($handle);
    
    if (trim(strtolower($line)) === 'y' || trim(strtolower($line)) === 'yes') {
        echo "\nRunning harvest notification check...\n";
        $result = $harvestService->checkHarvestNotifications();
        
        if ($result['success']) {
            echo "✅ Harvest notification check completed successfully!\n";
            echo "   - Lands processed: " . $result['lands_processed'] . "\n";
            echo "   - Notifications created: " . $result['notifications_created'] . "\n";
            echo "   - Notifications updated: " . $result['notifications_updated'] . "\n";
            echo "   - Farm works created: " . $result['farm_works_created'] . "\n";
        } else {
            echo "❌ Harvest notification check failed: " . $result['error'] . "\n";
        }
    } else {
        echo "\nSkipping actual harvest notification check.\n";
    }
    
    echo "\n=== Test Completed Successfully ===\n";
    
} catch (Exception $e) {
    echo "\n❌ Test Failed: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}






