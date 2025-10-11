<?php

namespace App;

use App\Database;
use App\FarmWork;
use App\WorkType;
use App\NotificationService;

class FarmWorkNotificationService
{
    private $db;
    private $farmWork;
    private $workType;
    private $notificationService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->farmWork = new FarmWork();
        $this->workType = new WorkType();
        $this->notificationService = new NotificationService();
    }

    /**
     * Create farm work from notification data (called by HarvestNotificationService)
     */
    public function createFarmWorkFromNotification($farmWorkData)
    {
        try {
            // Create the farm work using the FarmWork model
            $farmWork = $this->farmWork->create($farmWorkData);
            
            if ($farmWork) {
                echo "Created farm work: {$farmWork['title']}\n";
                return $farmWork;
            }
            
            return null;
            
        } catch (\Exception $e) {
            error_log("Error creating farm work from notification: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create farm work from harvest notifications
     */
    public function createFarmWorkFromHarvestNotifications()
    {
        // Find harvest notifications that haven't been converted to farm work yet
        $sql = "
            SELECT 
                n.id as notification_id,
                n.land_id,
                n.user_id,
                n.title,
                n.message,
                n.type,
                l.land_name,
                l.land_code,
                l.plant_type_id,
                pt.name as plant_type_name
            FROM notifications n
            JOIN lands l ON n.land_id = l.id
            LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
            WHERE n.type IN ('harvest_due', 'harvest_overdue')
            AND n.is_dismissed = 0
            AND NOT EXISTS (
                SELECT 1 FROM farm_works fw 
                WHERE fw.land_id = n.land_id 
                AND fw.work_type_id = (
                    SELECT id FROM work_types 
                    WHERE name = 'Harvesting' AND is_active = 1 
                    LIMIT 1
                )
                AND fw.status NOT IN ('completed', 'canceled')
                AND fw.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            )
            AND n.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ";

        $harvestNotifications = $this->db->fetchAll($sql);
        $worksCreated = 0;
        $results = [];

        foreach ($harvestNotifications as $notification) {
            try {
                // Get the harvesting work type
                $harvestWorkType = $this->workType->getAll(['category_id' => 3]); // Harvesting category
                $harvestWorkType = array_filter($harvestWorkType, function($wt) {
                    return strtolower($wt['name']) === 'harvesting';
                });

                if (empty($harvestWorkType)) {
                    $results[] = [
                        'notification_id' => $notification['notification_id'],
                        'land_id' => $notification['land_id'],
                        'land_name' => $notification['land_name'],
                        'status' => 'failed',
                        'error' => 'Harvesting work type not found'
                    ];
                    continue;
                }

                $harvestWorkType = array_values($harvestWorkType)[0];

                // Create farm work
                $workData = [
                    'title' => "Harvest {$notification['land_name']} ({$notification['land_code']})",
                    'description' => "Automatic harvest work created from notification: {$notification['message']}",
                    'land_id' => $notification['land_id'],
                    'work_type_id' => $harvestWorkType['id'],
                    'priority_level' => $notification['type'] === 'harvest_overdue' ? 'critical' : 'high',
                    'status' => 'created',
                    'creator_user_id' => 1, // System user
                    'due_date' => $this->calculateHarvestDueDate($notification['land_id'])
                ];

                $work = $this->farmWork->create($workData);
                $worksCreated++;

                $results[] = [
                    'notification_id' => $notification['notification_id'],
                    'land_id' => $notification['land_id'],
                    'land_name' => $notification['land_name'],
                    'work_id' => $work['id'],
                    'status' => 'created'
                ];

                // Mark the notification as dismissed since it's been converted to work
                $this->notificationService->dismissNotification($notification['notification_id']);

            } catch (\Exception $e) {
                error_log("Failed to create farm work from harvest notification {$notification['notification_id']}: " . $e->getMessage());
                $results[] = [
                    'notification_id' => $notification['notification_id'],
                    'land_id' => $notification['land_id'],
                    'land_name' => $notification['land_name'],
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'works_created' => $worksCreated,
            'total_notifications' => count($harvestNotifications),
            'results' => $results
        ];
    }

    /**
     * Create maintenance work from system notifications
     */
    public function createMaintenanceWork($landId, $maintenanceType, $dueDate, $priority = 'medium', $assignedTeamId = null)
    {
        try {
            // Get the maintenance work type
            $maintenanceWorkTypes = $this->workType->getAll(['category_id' => 1]); // Maintenance category
            
            // Find the most appropriate work type based on maintenance type
            $workType = null;
            foreach ($maintenanceWorkTypes as $wt) {
                if (stripos($wt['name'], $maintenanceType) !== false) {
                    $workType = $wt;
                    break;
                }
            }

            // If no specific match, use the first maintenance work type
            if (!$workType && !empty($maintenanceWorkTypes)) {
                $workType = $maintenanceWorkTypes[0];
            }

            if (!$workType) {
                throw new \Exception('No maintenance work type found');
            }

            // Get land information
            $landSql = "SELECT land_name, land_code FROM lands WHERE id = ?";
            $land = $this->db->fetchOne($landSql, [$landId]);

            $workData = [
                'title' => "Maintenance: {$maintenanceType} - {$land['land_name']}",
                'description' => "Scheduled maintenance work for {$maintenanceType}",
                'land_id' => $landId,
                'work_type_id' => $workType['id'],
                'priority_level' => $priority,
                'status' => $assignedTeamId ? 'assigned' : 'created',
                'creator_user_id' => 1, // System user
                'assigner_user_id' => $assignedTeamId ? 1 : null, // System user if assigned
                'assigned_team_id' => $assignedTeamId,
                'assigned_date' => $assignedTeamId ? date('Y-m-d H:i:s') : null,
                'due_date' => $dueDate
            ];

            $work = $this->farmWork->create($workData);

            // Create notification for the assigned team or land owner
            if ($assignedTeamId) {
                // Get team members
                $teamMembersSql = "SELECT user_id FROM team_members WHERE team_id = ?";
                $teamMembers = $this->db->fetchAll($teamMembersSql, [$assignedTeamId]);
                
                foreach ($teamMembers as $member) {
                    $this->notificationService->createNotification(
                        $landId,
                        $member['user_id'],
                        'work_assigned',
                        'New Work Assigned',
                        "Maintenance work '{$workData['title']}' has been assigned to your team",
                        $priority
                    );
                }
            } else {
                // Notify land owner
                $landOwnerSql = "SELECT created_by FROM lands WHERE id = ?";
                $landOwner = $this->db->fetchOne($landOwnerSql, [$landId]);
                
                if ($landOwner) {
                    $this->notificationService->createNotification(
                        $landId,
                        $landOwner['created_by'],
                        'work_created',
                        'New Work Created',
                        "Maintenance work '{$workData['title']}' has been created and needs assignment",
                        $priority
                    );
                }
            }

            return $work;

        } catch (\Exception $e) {
            error_log("Failed to create maintenance work: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Calculate harvest due date based on land data
     */
    private function calculateHarvestDueDate($landId)
    {
        $sql = "
            SELECT 
                l.next_harvest_date,
                l.previous_harvest_date,
                l.plant_date,
                pt.harvest_cycle_days
            FROM lands l
            LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
            WHERE l.id = ?
        ";

        $land = $this->db->fetchOne($sql, [$landId]);

        if ($land['next_harvest_date']) {
            return $land['next_harvest_date'];
        }

        if ($land['previous_harvest_date'] && $land['harvest_cycle_days']) {
            $previousHarvest = new \DateTime($land['previous_harvest_date']);
            $nextHarvest = clone $previousHarvest;
            $nextHarvest->add(new \DateInterval('P' . $land['harvest_cycle_days'] . 'D'));
            return $nextHarvest->format('Y-m-d H:i:s');
        }

        if ($land['plant_date'] && $land['harvest_cycle_days']) {
            $plantDate = new \DateTime($land['plant_date']);
            $firstHarvest = clone $plantDate;
            $firstHarvest->add(new \DateInterval('P' . $land['harvest_cycle_days'] . 'D'));
            return $firstHarvest->format('Y-m-d H:i:s');
        }

        // Default to 7 days from now if no harvest date can be calculated
        $defaultDate = new \DateTime();
        $defaultDate->add(new \DateInterval('P7D'));
        return $defaultDate->format('Y-m-d H:i:s');
    }

    /**
     * Create work from weather alerts
     */
    public function createWeatherAlertWork($landId, $alertType, $severity, $description = null)
    {
        try {
            // Get monitoring work type
            $monitoringWorkTypes = $this->workType->getAll(['category_id' => 4]); // Monitoring category
            $monitoringWorkType = array_filter($monitoringWorkTypes, function($wt) {
                return strtolower($wt['name']) === 'checking farmland';
            });

            if (empty($monitoringWorkType)) {
                $monitoringWorkType = !empty($monitoringWorkTypes) ? $monitoringWorkTypes[0] : null;
            } else {
                $monitoringWorkType = array_values($monitoringWorkType)[0];
            }

            if (!$monitoringWorkType) {
                throw new \Exception('No monitoring work type found');
            }

            // Get land information
            $landSql = "SELECT land_name, land_code FROM lands WHERE id = ?";
            $land = $this->db->fetchOne($landSql, [$landId]);

            $priority = $severity === 'high' ? 'critical' : 'high';
            $dueDate = new \DateTime();
            $dueDate->add(new \DateInterval('PT4H')); // Due in 4 hours for weather alerts

            $workData = [
                'title' => "Weather Alert Check: {$alertType} - {$land['land_name']}",
                'description' => $description ?: "Weather alert: {$alertType} - {$severity} severity. Please check for damage.",
                'land_id' => $landId,
                'work_type_id' => $monitoringWorkType['id'],
                'priority_level' => $priority,
                'status' => 'created',
                'creator_user_id' => 1, // System user
                'due_date' => $dueDate->format('Y-m-d H:i:s')
            ];

            $work = $this->farmWork->create($workData);

            // Create notification for land owner
            $landOwnerSql = "SELECT created_by FROM lands WHERE id = ?";
            $landOwner = $this->db->fetchOne($landOwnerSql, [$landId]);
            
            if ($landOwner) {
                $this->notificationService->createNotification(
                    $landId,
                    $landOwner['created_by'],
                    'weather_work_created',
                    'Weather Alert Work Created',
                    "Weather alert work '{$workData['title']}' has been created due to {$alertType}",
                    $priority
                );
            }

            return $work;

        } catch (\Exception $e) {
            error_log("Failed to create weather alert work: " . $e->getMessage());
            throw $e;
        }
    }
}
