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

    public static function generateToken($userId, $userRole)
    {
        $payload = [
            'user_id' => $userId,
            'role' => $userRole,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60), // 24 hours
        ];

        return JWT::encode($payload, self::$secretKey, self::$algorithm);
    }

    public static function validateToken($token)
    {
        try {
            $decoded = JWT::decode($token, new Key(self::$secretKey, self::$algorithm));
            return (array) $decoded;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function getCurrentUser()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return false;
        }

        $token = substr($authHeader, 7);
        return self::validateToken($token);
    }

    public static function requireAuth()
    {
        $user = self::getCurrentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        return $user;
    }

    public static function requireRole($requiredRole)
    {
        $user = self::requireAuth();
        
        $roleHierarchy = [
            'user' => 1,
            'admin' => 2,
            'system' => 3,
        ];

        $userRoleLevel = $roleHierarchy[$user['role']] ?? 0;
        $requiredRoleLevel = $roleHierarchy[$requiredRole] ?? 0;

        if ($userRoleLevel < $requiredRoleLevel) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }

        return $user;
    }
}
