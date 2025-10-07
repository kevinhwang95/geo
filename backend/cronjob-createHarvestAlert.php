<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
	
	$sql = "
		SELECT l.id, l.land_name, l.land_code, l.next_harvest_date, l.created_by
		FROM lands l
		WHERE l.is_active = 1
	";
	
	$stmt = $db->query($sql);
	$lands = $stmt->fetchAll(\PDO::FETCH_ASSOC);
	
	$notificationsCreated = 0;
	
	foreach ($lands as $land) {
		// Skip lands without harvest dates
		if (empty($land['next_harvest_date'])) {
			error_log("Skipping land {$land['id']} ({$land['land_name']}) - no harvest date set");
			continue;
		}
		
		try {
			$harvestDate = new \DateTime($land['next_harvest_date']);
			$today = new \DateTime();
			$daysUntilHarvest = $today->diff($harvestDate)->days;
		} catch (\Exception $e) {
			error_log("Invalid harvest date for land {$land['id']} ({$land['land_name']}): {$land['next_harvest_date']} - {$e->getMessage()}");
			continue;
		}
		
		// Create notification if harvest is due soon or overdue
		if ($daysUntilHarvest <= 7) {
			$type = $daysUntilHarvest <= 0 ? 'harvest_overdue' : 'harvest_due';
			$title = $daysUntilHarvest <= 0 ? 'Harvest Overdue' : 'Harvest Due Soon';
			$message = $daysUntilHarvest <= 0 
				? "Harvest for {$land['land_name']} is overdue by " . abs($daysUntilHarvest) . " days"
				: "Harvest for {$land['land_name']} is due in {$daysUntilHarvest} days";
			$priority = $daysUntilHarvest <= 0 ? 'high' : 'medium';
			
			// Check if notification already exists
			$stmt = $this->db->query("
				SELECT COUNT(*) FROM notifications 
				WHERE land_id = ? AND type = ? AND is_dismissed = 0
			", [$land['id'], $type]);
			
			if ($stmt->fetchColumn() == 0) {
				$stmt = $this->db->query("
					INSERT INTO notifications (land_id, user_id, type, title, message, priority)
					VALUES (?, ?, ?, ?, ?, ?)
				", [$land['id'], $land['created_by'], $type, $title, $message, $priority]);
				$notificationsCreated++;
			}
		}
	}
        
	echo json_encode([
		'success' => true,
		'message' => "Created {$notificationsCreated} harvest notifications",
		'count' => $notificationsCreated,
		'total_lands_checked' => count($lands)
	]);
    } catch (Exception $e) {
		echo "Error: " . $e->getMessage() . "\n";
	}