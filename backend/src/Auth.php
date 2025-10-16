<?php

namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth
{
    private static $secretKey;
    private static $algorithm;

    public static function init()
    {
        self::$secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret_key';
        self::$algorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';
    }

    public static function generateToken($userId, $userRole, $refreshToken = null)
    {
        $payload = [
            'user_id' => $userId,
            'role' => $userRole,
            'iat' => time(),
            'exp' => time() + (30 * 60), // 30 minutes for access token
            'type' => 'access'
        ];

        $accessToken = JWT::encode($payload, self::$secretKey, self::$algorithm);

        // Generate refresh token if not provided
        if (!$refreshToken) {
            $refreshPayload = [
                'user_id' => $userId,
                'role' => $userRole,
                'iat' => time(),
                'exp' => time() + (7 * 24 * 60 * 60), // 7 days
                'type' => 'refresh'
            ];
            $refreshToken = JWT::encode($refreshPayload, self::$secretKey, self::$algorithm);
            
            // Store refresh token in database
            self::storeRefreshToken($userId, $refreshToken);
        }

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 30 * 60
        ];
    }

    public static function validateToken($token)
    {
        try {
            $decoded = JWT::decode($token, new Key(self::$secretKey, self::$algorithm));
            $payload = (array) $decoded;
            
            // Check if token is revoked
            if (self::isTokenRevoked($payload['user_id'], $token)) {
                return false;
            }
            
            return $payload;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function refreshAccessToken($refreshToken)
    {
        $payload = self::validateToken($refreshToken);
        if (!$payload || $payload['type'] !== 'refresh') {
            return false;
        }

        // Generate new access token
        return self::generateToken($payload['user_id'], $payload['role'], $refreshToken);
    }

    public static function revokeToken($userId, $token)
    {
        $db = Database::getInstance();
        $tokenHash = hash('sha256', $token);
        return $db->query("UPDATE oauth_tokens SET is_revoked = 1, revoked_at = NOW() WHERE user_id = ? AND token_hash = ?", [$userId, $tokenHash]);
    }

    public static function revokeAllUserTokens($userId)
    {
        $db = Database::getInstance();
        return $db->query("UPDATE oauth_tokens SET is_revoked = 1, revoked_at = NOW() WHERE user_id = ?", [$userId]);
    }

    public static function requireAuth()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Authentication token required']);
            exit;
        }

        $token = $matches[1];
        $payload = self::validateToken($token);
        
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or expired token']);
            exit;
        }

        return $payload;
    }

    public static function requireRole($requiredRole)
    {
        $user = self::requireAuth();
        
        $roleHierarchy = [
            'user' => 1,
            'team_lead' => 2,
            'contributor' => 3,
            'admin' => 4,
        ];

        $userRoleLevel = $roleHierarchy[$user['role']] ?? 0;
        $requiredRoleLevel = $roleHierarchy[$requiredRole] ?? 0;

        if ($userRoleLevel < $requiredRoleLevel) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Insufficient permissions']);
            exit;
        }

        return $user;
    }

    public static function requireAnyRole($roles)
    {
        $user = self::requireAuth();
        
        if (!in_array($user['role'], $roles)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Insufficient permissions']);
            exit;
        }

        return $user;
    }

    /**
     * NEW: Check endpoint permissions based on database configuration
     */
    public static function requireEndpointPermission($endpointKey, $httpMethod = null)
    {
        $user = self::requireAuth();
        
        // If no HTTP method provided, try to get it from the request
        if (!$httpMethod) {
            $httpMethod = $_SERVER['REQUEST_METHOD'];
        }

        // Check if user has permission for this endpoint
        $hasPermission = self::checkEndpointPermission($user['role'], $endpointKey, $httpMethod);
        
        if (!$hasPermission) {
            http_response_code(403);
            echo json_encode([
                'error' => 'Forbidden', 
                'message' => 'You do not have permission to access this endpoint',
                'endpoint' => $endpointKey,
                'method' => $httpMethod
            ]);
            exit;
        }

        return $user;
    }

    /**
     * HYBRID: Check endpoint permissions with fallback to role-based system
     * This allows gradual migration from old to new permission system
     */
    public static function requireEndpointPermissionWithFallback($endpointKey, $fallbackRole, $httpMethod = null)
    {
        $user = self::requireAuth();
        
        // First try the new endpoint permission system
        $hasEndpointPermission = self::checkEndpointPermission($user['role'], $endpointKey, $httpMethod);
        
        if ($hasEndpointPermission) {
            return $user;
        }
        
        // Fallback to old role-based system
        $roleHierarchy = [
            'user' => 1,
            'team_lead' => 2,
            'contributor' => 3,
            'admin' => 4,
        ];

        $userRoleLevel = $roleHierarchy[$user['role']] ?? 0;
        $requiredRoleLevel = $roleHierarchy[$fallbackRole] ?? 0;

        if ($userRoleLevel < $requiredRoleLevel) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Insufficient permissions']);
            exit;
        }

        return $user;
    }

    /**
     * NEW: Check if a role has permission for a specific endpoint
     */
    public static function checkEndpointPermission($role, $endpointKey, $httpMethod = null)
    {
        try {
            $db = Database::getInstance();
            
            $query = "
                SELECT erp.is_allowed
                FROM endpoint_permissions ep
                JOIN endpoint_role_permissions erp ON ep.id = erp.endpoint_id
                WHERE ep.endpoint_key = ? 
                AND erp.role = ?
                AND ep.is_active = 1
            ";
            
            $params = [$endpointKey, $role];
            
            // If HTTP method is specified, also check that
            if ($httpMethod) {
                $query .= " AND ep.http_method = ?";
                $params[] = $httpMethod;
            }
            
            $result = $db->fetchOne($query, $params);
            
            return $result ? (bool)$result['is_allowed'] : false;
            
        } catch (\Exception $e) {
            error_log("Endpoint permission check error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * NEW: Get all permissions for a specific role
     */
    public static function getRolePermissions($role)
    {
        try {
            $db = Database::getInstance();
            
            $query = "
                SELECT 
                    ep.endpoint_key,
                    ep.endpoint_name,
                    ep.endpoint_description,
                    ep.http_method,
                    ep.endpoint_pattern,
                    erp.is_allowed
                FROM endpoint_permissions ep
                JOIN endpoint_role_permissions erp ON ep.id = erp.endpoint_id
                WHERE erp.role = ? 
                AND ep.is_active = 1
                ORDER BY ep.endpoint_key, ep.http_method
            ";
            
            return $db->fetchAll($query, [$role]);
            
        } catch (\Exception $e) {
            error_log("Get role permissions error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * NEW: Get all endpoints and their permissions for all roles
     */
    public static function getAllEndpointPermissions()
    {
        try {
            $db = Database::getInstance();
            
            $query = "
                SELECT 
                    ep.endpoint_key,
                    ep.endpoint_name,
                    ep.endpoint_description,
                    ep.http_method,
                    ep.endpoint_pattern,
                    ep.controller_method,
                    ep.is_active,
                    erp.role,
                    erp.is_allowed
                FROM endpoint_permissions ep
                LEFT JOIN endpoint_role_permissions erp ON ep.id = erp.endpoint_id
                WHERE ep.is_active = 1
                ORDER BY ep.endpoint_key, ep.http_method, erp.role
            ";
            
            return $db->fetchAll($query);
            
        } catch (\Exception $e) {
            error_log("Get all endpoint permissions error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * NEW: Update endpoint permission for a specific role
     */
    public static function updateEndpointPermission($endpointKey, $role, $isAllowed, $httpMethod = null)
    {
        try {
            $db = Database::getInstance();
            
            // First, get the endpoint ID
            $endpointQuery = "SELECT id FROM endpoint_permissions WHERE endpoint_key = ?";
            $params = [$endpointKey];
            
            if ($httpMethod) {
                $endpointQuery .= " AND http_method = ?";
                $params[] = $httpMethod;
            }
            
            $endpoint = $db->fetchOne($endpointQuery, $params);
            
            if (!$endpoint) {
                return false;
            }
            
            // Update or insert the permission
            $query = "
                INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed)
            ";
            
            return $db->query($query, [$endpoint['id'], $role, $isAllowed ? 1 : 0]);
            
        } catch (\Exception $e) {
            error_log("Update endpoint permission error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * NEW: Middleware function to automatically check endpoint permissions
     */
    public static function middleware($endpointKey, $httpMethod = null)
    {
        return function() use ($endpointKey, $httpMethod) {
            return self::requireEndpointPermission($endpointKey, $httpMethod);
        };
    }

    public static function getUserById($userId)
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT id, first_name, last_name, email, phone, role, language_preference, avatar_url, is_active, last_login, created_at FROM users WHERE id = ? AND is_active = 1", [$userId]);
        return $stmt->fetch();
    }

    public static function updateUserLastLogin($userId)
    {
        $db = Database::getInstance();
        return $db->query("UPDATE users SET last_login = NOW() WHERE id = ?", [$userId]);
    }

    private static function storeRefreshToken($userId, $refreshToken)
    {
        $db = Database::getInstance();
        $tokenHash = hash('sha256', $refreshToken);
        $expiresAt = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60)); // 7 days
        
        return $db->query("
            INSERT INTO oauth_tokens (user_id, token_hash, token_type, expires_at, created_at) 
            VALUES (?, ?, 'refresh', ?, NOW())
            ON DUPLICATE KEY UPDATE 
            token_hash = VALUES(token_hash), 
            expires_at = VALUES(expires_at), 
            created_at = NOW()
        ", [$userId, $tokenHash, $expiresAt]);
    }

    private static function isTokenRevoked($userId, $token)
    {
        $db = Database::getInstance();
        $tokenHash = hash('sha256', $token);
        $result = $db->fetchOne("SELECT is_revoked FROM oauth_tokens WHERE user_id = ? AND token_hash = ?", [$userId, $tokenHash]);
        
        return $result ? (bool)$result['is_revoked'] : false;
    }
}