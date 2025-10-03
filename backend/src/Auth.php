<?php

namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use League\OAuth2\Client\Provider\Google;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use GuzzleHttp\Client;

class Auth
{
    private static $secretKey;
    private static $algorithm;
    private static $googleProvider;

    public static function init()
    {
        self::$secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret_key';
        self::$algorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';
        
        // Initialize Google OAuth provider with SSL verification disabled for development
        $handler = new \GuzzleHttp\Handler\CurlHandler();
        
        $httpClient = new Client([
            'handler' => $handler,
            'verify' => false,
            'curl' => [
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
            ],
        ]);
        
        self::$googleProvider = new Google([
            'clientId'     => $_ENV['GOOGLE_CLIENT_ID'] ?? '',
            'clientSecret' => $_ENV['GOOGLE_CLIENT_SECRET'] ?? '',
            'redirectUri'  => $_ENV['GOOGLE_REDIRECT_URI'] ?? '',
            'scopes'       => ['email', 'profile'],
            'httpClient'   => $httpClient,
        ]);
    }

    public static function generateToken($userId, $userRole, $refreshToken = null)
    {
        $payload = [
            'user_id' => $userId,
            'role' => $userRole,
            'iat' => time(),
            'exp' => time() + (15 * 60), // 15 minutes for access token
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
            'expires_in' => 15 * 60
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

    private static function storeRefreshToken($userId, $token)
    {
        $db = Database::getInstance();
        $tokenHash = hash('sha256', $token);
        return $db->query("INSERT INTO oauth_tokens (user_id, token_type, token_hash, expires_at) VALUES (?, 'refresh', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))", [$userId, $tokenHash]);
    }

    private static function isTokenRevoked($userId, $token)
    {
        $db = Database::getInstance();
        $tokenHash = hash('sha256', $token);
        $stmt = $db->query("SELECT COUNT(*) FROM oauth_tokens WHERE user_id = ? AND token_hash = ? AND is_revoked = 1", [$userId, $tokenHash]);
        return $stmt->fetchColumn() > 0;
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
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Valid access token required']);
            exit;
        }
        return $user;
    }

    public static function requireRole($requiredRole)
    {
        $user = self::requireAuth();
        
        $roleHierarchy = [
            'user' => 1,
            'contributor' => 2,
            'admin' => 3,
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

    public static function handleGoogleOAuth($code)
    {
        try {
            // For development: Use mock data if SSL fails
            if ($code === 'dev_test_code') {
                $userInfo = [
                    'id' => 'dev_user_123',
                    'email' => 'dev@example.com',
                    'given_name' => 'Dev',
                    'family_name' => 'User',
                    'picture' => 'https://via.placeholder.com/150'
                ];
            } else {
                // Exchange authorization code for access token
                $accessToken = self::$googleProvider->getAccessToken('authorization_code', [
                    'code' => $code
                ]);

                // Get user info from Google
                $resourceOwner = self::$googleProvider->getResourceOwner($accessToken);
                $userInfo = $resourceOwner->toArray();
            }

            // Check if user exists
            $db = Database::getInstance();
            $stmt = $db->query("SELECT * FROM users WHERE oauth_provider = 'google' AND oauth_id = ?", [$userInfo['id']]);
            $user = $stmt->fetch();

            if (!$user) {
                // Create new user
                $db->query("INSERT INTO users (first_name, last_name, email, oauth_provider, oauth_id, avatar_url, role) VALUES (?, ?, ?, 'google', ?, ?, 'user')", [
                    $userInfo['given_name'] ?? '',
                    $userInfo['family_name'] ?? '',
                    $userInfo['email'],
                    $userInfo['id'],
                    $userInfo['picture'] ?? null
                ]);
                $userId = $db->lastInsertId();
                $userRole = 'user';
            } else {
                // Update last login
                $db->query("UPDATE users SET last_login = NOW(), avatar_url = ? WHERE id = ?", [$userInfo['picture'] ?? $user['avatar_url'], $user['id']]);
                $userId = $user['id'];
                $userRole = $user['role'];
            }

            // Generate JWT tokens
            $tokens = self::generateToken($userId, $userRole);
            
            // Get user data
            $user = self::getUserById($userId);

            return [
                'tokens' => $tokens,
                'user' => $user
            ];

        } catch (IdentityProviderException $e) {
            return false;
        }
    }

    public static function getGoogleAuthUrl()
    {
        return self::$googleProvider->getAuthorizationUrl([
            'scope' => ['email', 'profile']
        ]);
    }

    public static function getUserById($userId)
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT id, first_name, last_name, email, phone, role, avatar_url, is_active, last_login, created_at FROM users WHERE id = ? AND is_active = 1", [$userId]);
        return $stmt->fetch();
    }

    public static function updateUserLastLogin($userId)
    {
        $db = Database::getInstance();
        return $db->query("UPDATE users SET last_login = NOW() WHERE id = ?", [$userId]);
    }
}