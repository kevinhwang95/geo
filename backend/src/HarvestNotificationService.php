<?php

namespace App;

use App\Database;
use App\NotificationService;
use App\FarmWorkNotificationService;

class HarvestNotificationService
{
    private $db;
    private $notificationService;
    private $farmWorkService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->notificationService = new NotificationService();
        $this->farmWorkService = new FarmWorkNotificationService();
    }

    /**
     * Check all lands for harvest notifications and farm work creation
     * This is the main method to be called by the cron job
     */
    public function checkHarvestNotifications()
    {
        try {
            echo "Starting harvest notification check at " . date('Y-m-d H:i:s') . "\n";
            
            $landsToCheck = $this->getLandsForHarvestCheck();
            echo "Found " . count($landsToCheck) . " lands to check\n";

            $notificationsCreated = 0;
            $notificationsUpdated = 0;
            $farmWorksCreated = 0;

            foreach ($landsToCheck as $land) {
                $result = $this->processLandHarvest($land);
                $notificationsCreated += $result['notifications_created'];
                $notificationsUpdated += $result['notifications_updated'];
                $farmWorksCreated += $result['farm_works_created'];
            }

            echo "Harvest check completed:\n";
            echo "- Notifications created: $notificationsCreated\n";
            echo "- Notifications updated: $notificationsUpdated\n";
            echo "- Farm works created: $farmWorksCreated\n";

            return [
                'success' => true,
                'notifications_created' => $notificationsCreated,
                'notifications_updated' => $notificationsUpdated,
                'farm_works_created' => $farmWorksCreated,
                'lands_processed' => count($landsToCheck)
            ];

        } catch (\Exception $e) {
            error_log("HarvestNotificationService error: " . $e->getMessage());
            echo "Error in harvest notification check: " . $e->getMessage() . "\n";
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get all lands that need harvest checking
     */
    private function getLandsForHarvestCheck()
    {
        $sql = "SELECT 
                    l.id,
                    l.land_name,
                    l.land_code,
                    l.previous_harvest_date,
                    l.next_harvest_date,
                    l.created_by,
                    pt.harvest_cycle_days,
                    pt.name as plant_type_name,
                    u.first_name,
                    u.last_name
                FROM lands l
                LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
                LEFT JOIN users u ON l.created_by = u.id
                WHERE l.is_active = 1 
                AND l.previous_harvest_date IS NOT NULL
                AND pt.harvest_cycle_days IS NOT NULL
                AND pt.harvest_cycle_days > 0
                ORDER BY l.id";

        return $this->db->fetchAll($sql);
    }

    /**
     * Process harvest notification for a single land
     */
    private function processLandHarvest($land)
    {
        $notificationsCreated = 0;
        $notificationsUpdated = 0;
        $farmWorksCreated = 0;

        try {
            // Calculate next harvest date if not set
            if (empty($land['next_harvest_date'])) {
                $nextHarvestDate = $this->calculateNextHarvestDate(
                    $land['previous_harvest_date'], 
                    $land['harvest_cycle_days']
                );
                
                // Update the land with calculated next harvest date
                $this->updateNextHarvestDate($land['id'], $nextHarvestDate);
                $land['next_harvest_date'] = $nextHarvestDate;
            }

            // Calculate days until harvest
            $daysUntilHarvest = $this->calculateDaysUntilHarvest($land['next_harvest_date']);
            
            echo "Land {$land['land_name']} ({$land['land_code']}): {$daysUntilHarvest} days until harvest\n";

            // Check if we need to create or update notifications
            if ($daysUntilHarvest <= 3) {
                $notificationResult = $this->handleHarvestNotification($land, $daysUntilHarvest);
                $notificationsCreated += $notificationResult['created'];
                $notificationsUpdated += $notificationResult['updated'];

                // Create farm work if notification was created (3 days before)
                if ($notificationResult['created'] > 0 && $daysUntilHarvest == 3) {
                    $farmWorkResult = $this->createHarvestFarmWork($land);
                    $farmWorksCreated += $farmWorkResult;
                }
            }

        } catch (\Exception $e) {
            error_log("Error processing land {$land['id']}: " . $e->getMessage());
            echo "Error processing land {$land['id']}: " . $e->getMessage() . "\n";
        }

        return [
            'notifications_created' => $notificationsCreated,
            'notifications_updated' => $notificationsUpdated,
            'farm_works_created' => $farmWorksCreated
        ];
    }

    /**
     * Calculate next harvest date based on previous harvest date and cycle days
     */
    private function calculateNextHarvestDate($previousHarvestDate, $harvestCycleDays)
    {
        $previousDate = new \DateTime($previousHarvestDate);
        $nextDate = clone $previousDate;
        $nextDate->add(new \DateInterval("P{$harvestCycleDays}D"));
        return $nextDate->format('Y-m-d');
    }

    /**
     * Calculate days until harvest
     */
    private function calculateDaysUntilHarvest($nextHarvestDate)
    {
        $harvestDate = new \DateTime($nextHarvestDate);
        $today = new \DateTime();
        $today->setTime(0, 0, 0); // Set to start of day for accurate day calculation
        $harvestDate->setTime(0, 0, 0);
        
        $diff = $today->diff($harvestDate);
        $days = $diff->days;
        
        // If harvest date is in the past, return negative days
        if ($today > $harvestDate) {
            return -$days;
        }
        
        return $days;
    }

    /**
     * Update next harvest date in database
     */
    private function updateNextHarvestDate($landId, $nextHarvestDate)
    {
        $sql = "UPDATE lands SET next_harvest_date = :next_harvest_date, updated_at = NOW() WHERE id = :id";
        $this->db->query($sql, [
            'id' => $landId,
            'next_harvest_date' => $nextHarvestDate
        ]);
    }

    /**
     * Handle harvest notification creation and updates
     */
    private function handleHarvestNotification($land, $daysUntilHarvest)
    {
        $notificationsCreated = 0;
        $notificationsUpdated = 0;

        // Check if harvest notification already exists for this land and cycle
        $existingNotification = $this->getExistingHarvestNotification($land['id'], $land['next_harvest_date']);

        if (!$existingNotification) {
            // Create new notification
            $priority = $this->determineNotificationPriority($daysUntilHarvest);
            $title = $this->generateNotificationTitle($land, $daysUntilHarvest);
            $message = $this->generateNotificationMessage($land, $daysUntilHarvest);

            $notificationData = [
                'title' => $title,
                'message' => $message,
                'type' => 'harvest',
                'priority' => $priority,
                'land_id' => $land['id'],
                'created_by' => $land['created_by'],
                'metadata' => json_encode([
                    'land_code' => $land['land_code'],
                    'land_name' => $land['land_name'],
                    'plant_type_name' => $land['plant_type_name'],
                    'harvest_date' => $land['next_harvest_date'],
                    'days_until_harvest' => $daysUntilHarvest,
                    'harvest_cycle' => $land['harvest_cycle_days']
                ])
            ];

            $notification = $this->notificationService->createNotification($notificationData);
            if ($notification) {
                $notificationsCreated = 1;
                echo "Created harvest notification for land {$land['land_code']} - {$priority} priority\n";
            }
        } else {
            // Update existing notification priority if needed
            $newPriority = $this->determineNotificationPriority($daysUntilHarvest);
            if ($existingNotification['priority'] !== $newPriority) {
                $this->updateNotificationPriority($existingNotification['id'], $newPriority);
                $notificationsUpdated = 1;
                echo "Updated harvest notification for land {$land['land_code']} - new priority: {$newPriority}\n";
            }
        }

        return [
            'created' => $notificationsCreated,
            'updated' => $notificationsUpdated
        ];
    }

    /**
     * Get existing harvest notification for this land and harvest date
     */
    private function getExistingHarvestNotification($landId, $harvestDate)
    {
        $sql = "SELECT * FROM notifications 
                WHERE land_id = :land_id 
                AND type = 'harvest' 
                AND JSON_EXTRACT(metadata, '$.harvest_date') = :harvest_date
                AND is_active = 1
                ORDER BY created_at DESC 
                LIMIT 1";

        return $this->db->fetchOne($sql, [
            'land_id' => $landId,
            'harvest_date' => $harvestDate
        ]);
    }

    /**
     * Determine notification priority based on days until harvest
     */
    private function determineNotificationPriority($daysUntilHarvest)
    {
        if ($daysUntilHarvest <= 0) {
            return 'high'; // Overdue
        } elseif ($daysUntilHarvest == 1) {
            return 'high'; // 1 day before
        } elseif ($daysUntilHarvest <= 3) {
            return 'medium'; // 3 days before
        }
        
        return 'low';
    }

    /**
     * Generate notification title
     */
    private function generateNotificationTitle($land, $daysUntilHarvest)
    {
        if ($daysUntilHarvest <= 0) {
            return "Harvest Overdue - {$land['land_name']}";
        } elseif ($daysUntilHarvest == 1) {
            return "Harvest Tomorrow - {$land['land_name']}";
        } else {
            return "Harvest in {$daysUntilHarvest} Days - {$land['land_name']}";
        }
    }

    /**
     * Generate notification message
     */
    private function generateNotificationMessage($land, $daysUntilHarvest)
    {
        $landInfo = "Land: {$land['land_name']} ({$land['land_code']})";
        $plantInfo = "Plant Type: {$land['plant_type_name']}";
        $harvestDate = date('F j, Y', strtotime($land['next_harvest_date']));
        
        if ($daysUntilHarvest <= 0) {
            $overdueDays = abs($daysUntilHarvest);
            return "{$landInfo}\n{$plantInfo}\nHarvest Date: {$harvestDate}\nStatus: OVERDUE by {$overdueDays} days\nAction Required: Please harvest immediately.";
        } elseif ($daysUntilHarvest == 1) {
            return "{$landInfo}\n{$plantInfo}\nHarvest Date: {$harvestDate}\nStatus: Harvest is tomorrow!\nAction Required: Prepare for harvest.";
        } else {
            return "{$landInfo}\n{$plantInfo}\nHarvest Date: {$harvestDate}\nStatus: Harvest in {$daysUntilHarvest} days\nAction Required: Plan harvest activities.";
        }
    }

    /**
     * Update notification priority
     */
    private function updateNotificationPriority($notificationId, $newPriority)
    {
        $sql = "UPDATE notifications 
                SET priority = :priority, updated_at = NOW() 
                WHERE id = :id";

        $this->db->query($sql, [
            'id' => $notificationId,
            'priority' => $newPriority
        ]);
    }

    /**
     * Create farm work from harvest notification
     */
    private function createHarvestFarmWork($land)
    {
        try {
            // Get harvest work type ID
            $harvestWorkType = $this->getHarvestWorkType();
            if (!$harvestWorkType) {
                echo "Warning: Harvest work type not found\n";
                return 0;
            }

            // Check if farm work already exists for this harvest cycle
            $existingWork = $this->getExistingHarvestFarmWork($land['id'], $land['next_harvest_date']);
            if ($existingWork) {
                echo "Farm work already exists for land {$land['land_code']} harvest cycle\n";
                return 0;
            }

            // Create farm work data
            $farmWorkData = [
                'title' => "Harvest {$land['plant_type_name']} - {$land['land_name']}",
                'description' => "Harvest {$land['plant_type_name']} from {$land['land_name']} ({$land['land_code']}) scheduled for " . date('F j, Y', strtotime($land['next_harvest_date'])),
                'land_id' => $land['id'],
                'work_type_id' => $harvestWorkType['id'],
                'priority_level' => 'medium',
                'status' => 'pending',
                'due_date' => $land['next_harvest_date'],
                'created_by' => $land['created_by'],
                'metadata' => json_encode([
                    'land_code' => $land['land_code'],
                    'land_name' => $land['land_name'],
                    'plant_type_name' => $land['plant_type_name'],
                    'harvest_date' => $land['next_harvest_date'],
                    'harvest_cycle_days' => $land['harvest_cycle_days'],
                    'auto_created' => true,
                    'created_from' => 'harvest_notification'
                ])
            ];

            $farmWork = $this->farmWorkService->createFarmWorkFromNotification($farmWorkData);
            if ($farmWork) {
                echo "Created harvest farm work for land {$land['land_code']}\n";
                return 1;
            }

        } catch (\Exception $e) {
            error_log("Error creating harvest farm work for land {$land['id']}: " . $e->getMessage());
            echo "Error creating harvest farm work for land {$land['id']}: " . $e->getMessage() . "\n";
        }

        return 0;
    }

    /**
     * Get harvest work type
     */
    private function getHarvestWorkType()
    {
        $sql = "SELECT wt.id, wt.name 
                FROM work_types wt
                LEFT JOIN work_categories wc ON wt.category_id = wc.id
                WHERE LOWER(wt.name) LIKE '%harvest%' 
                OR LOWER(wc.name) LIKE '%harvest%'
                LIMIT 1";

        return $this->db->fetchOne($sql);
    }

    /**
     * Get existing harvest farm work for this land and harvest date
     */
    private function getExistingHarvestFarmWork($landId, $harvestDate)
    {
        $sql = "SELECT * FROM farm_works 
                WHERE land_id = :land_id 
                AND due_date = :harvest_date
                AND JSON_EXTRACT(metadata, '$.created_from') = 'harvest_notification'
                AND status NOT IN ('completed', 'canceled')
                LIMIT 1";

        return $this->db->fetchOne($sql, [
            'land_id' => $landId,
            'harvest_date' => $harvestDate
        ]);
    }

    /**
     * Sync notification and farm work status
     * This can be called when farm work status changes
     */
    public function syncNotificationWithFarmWork($farmWorkId)
    {
        try {
            // Get farm work details
            $farmWork = $this->getFarmWorkDetails($farmWorkId);
            if (!$farmWork) {
                return false;
            }

            // Find related harvest notification
            $notification = $this->getRelatedHarvestNotification($farmWork['land_id'], $farmWork['due_date']);
            if (!$notification) {
                return false;
            }

            // Update notification based on farm work status
            $newNotificationStatus = $this->mapFarmWorkStatusToNotificationStatus($farmWork['status']);
            if ($notification['status'] !== $newNotificationStatus) {
                $this->updateNotificationStatus($notification['id'], $newNotificationStatus);
                echo "Synced notification {$notification['id']} status to {$newNotificationStatus} based on farm work {$farmWorkId}\n";
            }

            return true;

        } catch (\Exception $e) {
            error_log("Error syncing notification with farm work {$farmWorkId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get farm work details
     */
    private function getFarmWorkDetails($farmWorkId)
    {
        $sql = "SELECT * FROM farm_works WHERE id = :id";
        return $this->db->fetchOne($sql, ['id' => $farmWorkId]);
    }

    /**
     * Get related harvest notification
     */
    private function getRelatedHarvestNotification($landId, $harvestDate)
    {
        $sql = "SELECT * FROM notifications 
                WHERE land_id = :land_id 
                AND type = 'harvest' 
                AND JSON_EXTRACT(metadata, '$.harvest_date') = :harvest_date
                AND is_active = 1
                ORDER BY created_at DESC 
                LIMIT 1";

        return $this->db->fetchOne($sql, [
            'land_id' => $landId,
            'harvest_date' => $harvestDate
        ]);
    }

    /**
     * Map farm work status to notification status
     */
    private function mapFarmWorkStatusToNotificationStatus($farmWorkStatus)
    {
        switch ($farmWorkStatus) {
            case 'completed':
                return 'completed';
            case 'in_progress':
                return 'in_progress';
            case 'canceled':
                return 'dismissed';
            default:
                return 'pending';
        }
    }

    /**
     * Update notification status
     */
    private function updateNotificationStatus($notificationId, $newStatus)
    {
        $sql = "UPDATE notifications 
                SET status = :status, updated_at = NOW() 
                WHERE id = :id";

        $this->db->query($sql, [
            'id' => $notificationId,
            'status' => $newStatus
        ]);
    }
}





