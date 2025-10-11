<?php

require_once __DIR__ . '/src/Database.php';

use App\Database;

try {
    $db = Database::getInstance();
    
    echo "Seeding work categories and work types...\n";
    
    // Check if work categories already exist
    $existingCategories = $db->fetchAll("SELECT COUNT(*) as count FROM work_categories");
    if ($existingCategories[0]['count'] > 0) {
        echo "Work categories already exist, skipping...\n";
    } else {
        // Insert sample work categories
        $categories = [
            ['name' => 'Planting', 'description' => 'Planting and seeding activities', 'color' => '#10B981', 'icon' => 'seedling'],
            ['name' => 'Harvesting', 'description' => 'Harvest and collection activities', 'color' => '#F59E0B', 'icon' => 'harvest'],
            ['name' => 'Maintenance', 'description' => 'Maintenance and upkeep activities', 'color' => '#3B82F6', 'icon' => 'wrench'],
            ['name' => 'Irrigation', 'description' => 'Watering and irrigation activities', 'color' => '#06B6D4', 'icon' => 'droplets'],
            ['name' => 'Pest Control', 'description' => 'Pest and disease control activities', 'color' => '#EF4444', 'icon' => 'shield'],
            ['name' => 'Soil Management', 'description' => 'Soil preparation and fertilization', 'color' => '#8B5CF6', 'icon' => 'activity']
        ];
        
        $categoryStmt = $db->prepare("INSERT INTO work_categories (name, description, color, icon, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())");
        
        foreach ($categories as $category) {
            $categoryStmt->execute([$category['name'], $category['description'], $category['color'], $category['icon']]);
            echo "Inserted category: " . $category['name'] . "\n";
        }
    }
    
    // Check if work types already exist
    $existingTypes = $db->fetchAll("SELECT COUNT(*) as count FROM work_types");
    if ($existingTypes[0]['count'] > 0) {
        echo "Work types already exist, skipping...\n";
    } else {
        // Get category IDs
        $categoryIds = [];
        $categories = $db->fetchAll("SELECT id, name FROM work_categories");
        foreach ($categories as $category) {
            $categoryIds[$category['name']] = $category['id'];
        }
        
        // Insert sample work types
        $workTypes = [
            // Planting activities
            ['name' => 'Seed Planting', 'description' => 'Plant seeds in prepared soil', 'category' => 'Planting', 'icon' => 'seedling', 'estimated_duration_hours' => 4.0],
            ['name' => 'Seedling Transplanting', 'description' => 'Transplant seedlings to field', 'category' => 'Planting', 'icon' => 'activity', 'estimated_duration_hours' => 6.0],
            
            // Harvesting activities
            ['name' => 'Fruit Harvesting', 'description' => 'Harvest ripe fruits from trees', 'category' => 'Harvesting', 'icon' => 'harvest', 'estimated_duration_hours' => 8.0],
            ['name' => 'Vegetable Harvesting', 'description' => 'Harvest vegetables from field', 'category' => 'Harvesting', 'icon' => 'activity', 'estimated_duration_hours' => 6.0],
            
            // Maintenance activities
            ['name' => 'Weed Removal', 'description' => 'Remove weeds from fields', 'category' => 'Maintenance', 'icon' => 'scissors', 'estimated_duration_hours' => 4.0],
            ['name' => 'Equipment Repair', 'description' => 'Repair and maintain farm equipment', 'category' => 'Maintenance', 'icon' => 'wrench', 'estimated_duration_hours' => 2.0],
            
            // Irrigation activities
            ['name' => 'Field Irrigation', 'description' => 'Water crops using irrigation system', 'category' => 'Irrigation', 'icon' => 'droplets', 'estimated_duration_hours' => 3.0],
            ['name' => 'Manual Watering', 'description' => 'Water plants manually', 'category' => 'Irrigation', 'icon' => 'droplets', 'estimated_duration_hours' => 5.0],
            
            // Pest control activities
            ['name' => 'Pest Spraying', 'description' => 'Apply pest control treatments', 'category' => 'Pest Control', 'icon' => 'shield', 'estimated_duration_hours' => 3.0],
            ['name' => 'Disease Treatment', 'description' => 'Treat plant diseases', 'category' => 'Pest Control', 'icon' => 'shield', 'estimated_duration_hours' => 4.0],
            
            // Soil management activities
            ['name' => 'Soil Preparation', 'description' => 'Prepare soil for planting', 'category' => 'Soil Management', 'icon' => 'activity', 'estimated_duration_hours' => 6.0],
            ['name' => 'Fertilization', 'description' => 'Apply fertilizers to soil', 'category' => 'Soil Management', 'icon' => 'activity', 'estimated_duration_hours' => 4.0]
        ];
        
        $workTypeStmt = $db->prepare("INSERT INTO work_types (name, description, category_id, icon, estimated_duration_hours, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())");
        
        foreach ($workTypes as $workType) {
            if (isset($categoryIds[$workType['category']])) {
                $workTypeStmt->execute([
                    $workType['name'], 
                    $workType['description'], 
                    $categoryIds[$workType['category']], 
                    $workType['icon'], 
                    $workType['estimated_duration_hours']
                ]);
                echo "Inserted work type: " . $workType['name'] . " (Category: " . $workType['category'] . ")\n";
            } else {
                echo "Warning: Category '" . $workType['category'] . "' not found for work type '" . $workType['name'] . "'\n";
            }
        }
    }
    
    echo "Seeding completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error seeding data: " . $e->getMessage() . "\n";
    exit(1);
}
?>



