<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;

// Load environment variables
$dotenv = Dotenv::createImmutable('.');
$dotenv->load();

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    // Check if lands table has data
    $stmt = $db->query("SELECT COUNT(*) FROM lands");
    $count = $stmt->fetchColumn();
    echo "Current lands count: {$count}\n";
    
    if ($count == 0) {
        echo "Adding sample lands...\n";
        
        // Sample land data (without next_harvest_date - let trigger calculate it)
        $sampleLands = [
            [
                'land_name' => 'North Field',
                'land_code' => 'NF001',
                'deed_number' => 'DEED001',
                'location' => 'North District',
                'province' => 'Central Province',
                'district' => 'North District',
                'city' => 'North City',
                'plant_type_id' => 1, // Rice
                'category_id' => 1, // Food Crops
                'plant_date' => '2023-01-15',
                'harvest_cycle_days' => 120,
                'geometry' => '{"type":"Polygon","coordinates":[[[100.5,13.7],[100.6,13.7],[100.6,13.8],[100.5,13.8],[100.5,13.7]]]}',
                'size' => 2500.5,
                'owner_name' => 'John Doe',
                'notes' => 'Main rice field for the season',
                'created_by' => 1
            ],
            [
                'land_name' => 'South Field',
                'land_code' => 'SF002',
                'deed_number' => 'DEED002',
                'location' => 'South District',
                'province' => 'Central Province',
                'district' => 'South District',
                'city' => 'South City',
                'plant_type_id' => 2, // Corn
                'category_id' => 1, // Food Crops
                'plant_date' => '2023-03-01',
                'harvest_cycle_days' => 90,
                'geometry' => '{"type":"Polygon","coordinates":[[[100.7,13.5],[100.8,13.5],[100.8,13.6],[100.7,13.6],[100.7,13.5]]]}',
                'size' => 1800.0,
                'owner_name' => 'Jane Smith',
                'notes' => 'Corn field with irrigation system',
                'created_by' => 1
            ],
            [
                'land_name' => 'East Garden',
                'land_code' => 'EG003',
                'deed_number' => 'DEED003',
                'location' => 'East District',
                'province' => 'Central Province',
                'district' => 'East District',
                'city' => 'East City',
                'plant_type_id' => 5, // Tomato
                'category_id' => 1, // Food Crops
                'plant_date' => '2024-02-15',
                'harvest_cycle_days' => 75,
                'geometry' => '{"type":"Polygon","coordinates":[[[100.9,13.6],[101.0,13.6],[101.0,13.7],[100.9,13.7],[100.9,13.6]]]}',
                'size' => 1200.75,
                'owner_name' => 'Bob Wilson',
                'notes' => 'Organic tomato garden',
                'created_by' => 1
            ]
        ];
        
        foreach ($sampleLands as $land) {
            $sql = "INSERT INTO lands (
                        land_name, land_code, deed_number, location, 
                        province, district, city, plant_type_id, category_id, 
                        plant_date, harvest_cycle_days, geometry, size, 
                        owner_name, notes, created_by, created_at, updated_at
                    ) VALUES (
                        :land_name, :land_code, :deed_number, :location,
                        :province, :district, :city, :plant_type_id, :category_id,
                        :plant_date, :harvest_cycle_days, :geometry, :size,
                        :owner_name, :notes, :created_by, NOW(), NOW()
                    )";
            
            $db->query($sql, $land);
            echo "Added land: {$land['land_name']} ({$land['land_code']})\n";
        }
        
        echo "Sample lands added successfully!\n";
    } else {
        echo "Lands already exist in database.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
