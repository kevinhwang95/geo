<?php

namespace App\Controllers;

use App\Database;
use Exception;
use PDO;

class NavigationMenuController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all navigation menus with permissions for a specific role
     */
    public function getMenusForRole($role)
    {
        try {
            $query = "
                SELECT 
                    nm.id,
                    nm.menu_key,
                    nm.label,
                    nm.icon,
                    nm.route,
                    nm.order_index,
                    nm.is_active,
                    nmp.is_visible
                FROM navigation_menus nm
                LEFT JOIN navigation_menu_permissions nmp ON nm.id = nmp.menu_id AND nmp.role = :role
                WHERE nm.is_active = 1
                ORDER BY nm.order_index ASC, nm.label ASC
            ";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role', $role);
            $stmt->execute();

            $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Filter out menus that are not visible for this role
            $visibleMenus = array_filter($menus, function($menu) {
                return $menu['is_visible'] == 1;
            });

            return [
                'success' => true,
                'data' => array_values($visibleMenus)
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to fetch navigation menus: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get all navigation menus (admin only)
     */
    public function getAllMenus()
    {
        try {
            $query = "
                SELECT 
                    nm.id,
                    nm.menu_key,
                    nm.label,
                    nm.icon,
                    nm.route,
                    nm.order_index,
                    nm.is_active,
                    nm.created_at,
                    nm.updated_at
                FROM navigation_menus nm
                ORDER BY nm.order_index ASC, nm.label ASC
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute();

            $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get permissions for each menu
            foreach ($menus as &$menu) {
                $permissionsQuery = "
                    SELECT role, is_visible 
                    FROM navigation_menu_permissions 
                    WHERE menu_id = :menu_id
                ";
                $permissionsStmt = $this->db->prepare($permissionsQuery);
                $permissionsStmt->bindParam(':menu_id', $menu['id']);
                $permissionsStmt->execute();
                
                $permissions = $permissionsStmt->fetchAll(PDO::FETCH_ASSOC);
                $menu['permissions'] = array_column($permissions, 'is_visible', 'role');
                
                // Debug logging
                error_log("Menu {$menu['label']} permissions: " . json_encode($menu['permissions']));
            }

            return [
                'success' => true,
                'data' => $menus
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to fetch all navigation menus: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create a new navigation menu item
     */
    public function createMenu($data)
    {
        try {
            $this->db->beginTransaction();

            // Insert menu item
            $menuQuery = "
                INSERT INTO navigation_menus (menu_key, label, icon, route, order_index, is_active)
                VALUES (:menu_key, :label, :icon, :route, :order_index, :is_active)
            ";

            $menuStmt = $this->db->prepare($menuQuery);
            $menuStmt->bindParam(':menu_key', $data['menu_key']);
            $menuStmt->bindParam(':label', $data['label']);
            $menuStmt->bindParam(':icon', $data['icon']);
            $menuStmt->bindParam(':route', $data['route']);
            $menuStmt->bindParam(':order_index', $data['order_index']);
            $menuStmt->bindParam(':is_active', $data['is_active']);
            $menuStmt->execute();

            $menuId = $this->db->lastInsertId();

            // Insert permissions for each role
            $roles = ['admin', 'contributor', 'team_lead', 'user'];
            foreach ($roles as $role) {
                $isVisible = isset($data['permissions'][$role]) ? $data['permissions'][$role] : false;
                
                $permissionQuery = "
                    INSERT INTO navigation_menu_permissions (menu_id, role, is_visible)
                    VALUES (:menu_id, :role, :is_visible)
                ";
                
                $permissionStmt = $this->db->prepare($permissionQuery);
                $permissionStmt->bindParam(':menu_id', $menuId);
                $permissionStmt->bindParam(':role', $role);
                $permissionStmt->bindParam(':is_visible', $isVisible, PDO::PARAM_BOOL);
                $permissionStmt->execute();
            }

            $this->db->commit();

            return [
                'success' => true,
                'data' => ['id' => $menuId],
                'message' => 'Navigation menu created successfully'
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => 'Failed to create navigation menu: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update a navigation menu item
     */
    public function updateMenu($id, $data)
    {
        try {
            $this->db->beginTransaction();

            // Update menu item
            $menuQuery = "
                UPDATE navigation_menus 
                SET menu_key = :menu_key, 
                    label = :label, 
                    icon = :icon, 
                    route = :route, 
                    order_index = :order_index, 
                    is_active = :is_active
                WHERE id = :id
            ";

            $menuStmt = $this->db->prepare($menuQuery);
            $menuStmt->bindParam(':id', $id);
            $menuStmt->bindParam(':menu_key', $data['menu_key']);
            $menuStmt->bindParam(':label', $data['label']);
            $menuStmt->bindParam(':icon', $data['icon']);
            $menuStmt->bindParam(':route', $data['route']);
            $menuStmt->bindParam(':order_index', $data['order_index']);
            $menuStmt->bindParam(':is_active', $data['is_active']);
            $menuStmt->execute();

            // Update permissions
            $roles = ['admin', 'contributor', 'team_lead', 'user'];
            foreach ($roles as $role) {
                $isVisible = isset($data['permissions'][$role]) ? $data['permissions'][$role] : false;
                
                $permissionQuery = "
                    UPDATE navigation_menu_permissions 
                    SET is_visible = :is_visible
                    WHERE menu_id = :menu_id AND role = :role
                ";
                
                $permissionStmt = $this->db->prepare($permissionQuery);
                $permissionStmt->bindParam(':menu_id', $id);
                $permissionStmt->bindParam(':role', $role);
                $permissionStmt->bindParam(':is_visible', $isVisible, PDO::PARAM_BOOL);
                $permissionStmt->execute();
            }

            $this->db->commit();

            return [
                'success' => true,
                'message' => 'Navigation menu updated successfully'
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => 'Failed to update navigation menu: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete a navigation menu item
     */
    public function deleteMenu($id)
    {
        try {
            $this->db->beginTransaction();

            // Delete permissions first (due to foreign key constraint)
            $deletePermissionsQuery = "DELETE FROM navigation_menu_permissions WHERE menu_id = :menu_id";
            $deletePermissionsStmt = $this->db->prepare($deletePermissionsQuery);
            $deletePermissionsStmt->bindParam(':menu_id', $id);
            $deletePermissionsStmt->execute();

            // Delete menu item
            $deleteMenuQuery = "DELETE FROM navigation_menus WHERE id = :id";
            $deleteMenuStmt = $this->db->prepare($deleteMenuQuery);
            $deleteMenuStmt->bindParam(':id', $id);
            $deleteMenuStmt->execute();

            $this->db->commit();

            return [
                'success' => true,
                'message' => 'Navigation menu deleted successfully'
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => 'Failed to delete navigation menu: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update menu order
     */
    public function updateMenuOrder($menuOrders)
    {
        try {
            $this->db->beginTransaction();

            foreach ($menuOrders as $menuOrder) {
                $query = "UPDATE navigation_menus SET order_index = :order_index WHERE id = :id";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':id', $menuOrder['id']);
                $stmt->bindParam(':order_index', $menuOrder['order_index']);
                $stmt->execute();
            }

            $this->db->commit();

            return [
                'success' => true,
                'message' => 'Menu order updated successfully'
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => 'Failed to update menu order: ' . $e->getMessage()
            ];
        }
    }
}
