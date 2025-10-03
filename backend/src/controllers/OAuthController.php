<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

class OAuthController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function googleLogin()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['code'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Authorization code required']);
            return;
        }

        $result = Auth::handleGoogleOAuth($input['code']);
        
        if (!$result) {
            http_response_code(401);
            echo json_encode(['error' => 'OAuth authentication failed']);
            return;
        }

        // Extract tokens and user info from result
        $tokens = $result['tokens'];
        $user = $result['user'];

        echo json_encode([
            'success' => true,
            'tokens' => $tokens,
            'user' => $user
        ]);
    }

    public function refreshToken()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['refresh_token'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Refresh token required']);
            return;
        }

        $tokens = Auth::refreshAccessToken($input['refresh_token']);
        
        if (!$tokens) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid refresh token']);
            return;
        }

        echo json_encode([
            'success' => true,
            'tokens' => $tokens
        ]);
    }

    public function logout()
    {
        $user = Auth::requireAuth();
        
        // Revoke all user tokens
        Auth::revokeAllUserTokens($user['user_id']);
        
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    }

    public function getGoogleAuthUrl()
    {
        $authUrl = Auth::getGoogleAuthUrl();
        echo json_encode(['auth_url' => $authUrl]);
    }

    public function googleCallback()
    {
        echo "Callback method called!";
    }
}
