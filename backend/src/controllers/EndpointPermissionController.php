<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

class EndpointPermissionController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all endpoint permissions for all roles
     */
    public function index()
    {
        Auth::requireRole('admin');
        
        try {
            $permissions = Auth::getAllEndpointPermissions();
            
            // Group permissions by endpoint
            $groupedPermissions = [];
            foreach ($permissions as $permission) {
                $key = $permission['endpoint_key'] . ':' . $permission['http_method'];
                
                if (!isset($groupedPermissions[$key])) {
                    $groupedPermissions[$key] = [
                        'endpoint_key' => $permission['endpoint_key'],
                        'endpoint_name' => $permission['endpoint_name'],
                        'endpoint_description' => $permission['endpoint_description'],
                        'http_method' => $permission['http_method'],
                        'endpoint_pattern' => $permission['endpoint_pattern'],
                        'controller_method' => $permission['controller_method'],
                        'is_active' => (bool)$permission['is_active'],
                        'permissions' => []
                    ];
                }
                
                if ($permission['role']) {
                    $groupedPermissions[$key]['permissions'][$permission['role']] = (bool)$permission['is_allowed'];
                }
            }
            
            return [
                'success' => true,
                'data' => array_values($groupedPermissions)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to fetch endpoint permissions: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get permissions for a specific role
     */
    public function getRolePermissions($role)
    {
        Auth::requireRole('admin');
        
        try {
            $permissions = Auth::getRolePermissions($role);
            
            return [
                'success' => true,
                'data' => $permissions
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to fetch role permissions: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update endpoint permission for a specific role
     */
    public function updatePermission()
    {
        Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['endpoint_key']) || !isset($input['role']) || !isset($input['is_allowed'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: endpoint_key, role, is_allowed']);
            return;
        }

        try {
            $success = Auth::updateEndpointPermission(
                $input['endpoint_key'],
                $input['role'],
                $input['is_allowed'],
                $input['http_method'] ?? null
            );
            
            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Permission updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update permission']);
            }
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update permission: ' . $e->getMessage()]);
        }
    }

    /**
     * Bulk update permissions for multiple endpoints
     */
    public function bulkUpdatePermissions()
    {
        Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['permissions']) || !is_array($input['permissions'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing or invalid permissions array']);
            return;
        }

        try {
            $this->db->beginTransaction();
            
            $successCount = 0;
            $errorCount = 0;
            
            foreach ($input['permissions'] as $permission) {
                if (!isset($permission['endpoint_key']) || !isset($permission['role']) || !isset($permission['is_allowed'])) {
                    $errorCount++;
                    continue;
                }
                
                $success = Auth::updateEndpointPermission(
                    $permission['endpoint_key'],
                    $permission['role'],
                    $permission['is_allowed'],
                    $permission['http_method'] ?? null
                );
                
                if ($success) {
                    $successCount++;
                } else {
                    $errorCount++;
                }
            }
            
            $this->db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => "Bulk update completed: {$successCount} successful, {$errorCount} failed",
                'success_count' => $successCount,
                'error_count' => $errorCount
            ]);
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Bulk update failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Get endpoint permission matrix (all endpoints vs all roles)
     */
    public function getPermissionMatrix()
    {
        Auth::requireRole('admin');
        
        try {
            $query = "
                SELECT 
                    ep.endpoint_key,
                    ep.endpoint_name,
                    ep.http_method,
                    ep.endpoint_pattern,
                    ep.is_active,
                    GROUP_CONCAT(
                        CONCAT(erp.role, ':', erp.is_allowed) 
                        ORDER BY erp.role 
                        SEPARATOR ','
                    ) as role_permissions
                FROM endpoint_permissions ep
                LEFT JOIN endpoint_role_permissions erp ON ep.id = erp.endpoint_id
                WHERE ep.is_active = 1
                GROUP BY ep.id, ep.endpoint_key, ep.endpoint_name, ep.http_method, ep.endpoint_pattern, ep.is_active
                ORDER BY ep.endpoint_key, ep.http_method
            ";
            
            $results = $this->db->fetchAll($query);
            
            $matrix = [];
            $roles = ['admin', 'contributor', 'team_lead', 'user'];
            
            foreach ($results as $result) {
                $permissions = [];
                $rolePermissions = explode(',', $result['role_permissions']);
                
                foreach ($rolePermissions as $rolePerm) {
                    if (strpos($rolePerm, ':') !== false) {
                        list($role, $allowed) = explode(':', $rolePerm);
                        $permissions[$role] = (bool)$allowed;
                    }
                }
                
                // Ensure all roles are represented
                foreach ($roles as $role) {
                    if (!isset($permissions[$role])) {
                        $permissions[$role] = false;
                    }
                }
                
                $matrix[] = [
                    'endpoint_key' => $result['endpoint_key'],
                    'endpoint_name' => $result['endpoint_name'],
                    'http_method' => $result['http_method'],
                    'endpoint_pattern' => $result['endpoint_pattern'],
                    'is_active' => (bool)$result['is_active'],
                    'permissions' => $permissions
                ];
            }
            
            return [
                'success' => true,
                'data' => $matrix,
                'roles' => $roles
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to fetch permission matrix: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Reset permissions to defaults
     */
    public function resetToDefaults()
    {
        Auth::requireRole('admin');
        
        try {
            // This would require re-running the migration or having a reset script
            // For now, we'll just return a message
            echo json_encode([
                'success' => true,
                'message' => 'To reset permissions to defaults, please re-run the migration: 004_create_endpoint_permissions.sql'
            ]);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to reset permissions: ' . $e->getMessage()]);
        }
    }
}
