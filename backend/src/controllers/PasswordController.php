<?php

namespace App\Controllers;

use App\Database;
use App\Services\EmailService;
use Exception;
use PDO;

class PasswordController
{
    private $db;
    private $emailService;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->emailService = new EmailService();
    }

    /**
     * Send password setup email for new user
     */
    public function sendPasswordSetupEmail()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['user_id']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User ID and email are required']);
                return;
            }

            $userId = $input['user_id'];
            $userEmail = $input['email'];

            // Get user details
            $query = "SELECT id, email, first_name, last_name FROM users WHERE id = ? AND email = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$userId, $userEmail]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
                return;
            }

            // Generate secure token
            $token = $this->emailService->generateSecureToken($userId, 'password_setup');
            
            if (!$token) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to generate token']);
                return;
            }

            // Send email
            $userName = trim($user['first_name'] . ' ' . $user['last_name']);
            $result = $this->emailService->sendPasswordSetupEmail($userEmail, $userName, $token);

            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Password setup email sent successfully',
                    'token' => $token // For testing purposes, remove in production
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $result['message']]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
        }
    }

    /**
     * Validate password setup token
     */
    public function validatePasswordSetupToken()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['token'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Token is required']);
                return;
            }

            $token = $input['token'];
            $tokenData = $this->emailService->validateToken($token);

            if (!$tokenData) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
                return;
            }

            if ($tokenData['type'] !== 'password_setup') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid token type']);
                return;
            }

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $tokenData['user_id'],
                    'email' => $tokenData['email'],
                    'first_name' => $tokenData['first_name'],
                    'last_name' => $tokenData['last_name']
                ],
                'expires_at' => $tokenData['expires_at']
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
        }
    }

    /**
     * Validate password reset token
     */
    public function validatePasswordResetToken()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['token'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Token is required']);
                return;
            }

            $token = $input['token'];
            $tokenData = $this->emailService->validateToken($token);

            if (!$tokenData) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
                return;
            }

            if ($tokenData['type'] !== 'password_reset') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid token type']);
                return;
            }

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $tokenData['user_id'],
                    'email' => $tokenData['email'],
                    'first_name' => $tokenData['first_name'],
                    'last_name' => $tokenData['last_name']
                ],
                'expires_at' => $tokenData['expires_at']
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
        }
    }

    /**
     * Set up password using token
     */
    public function setupPassword()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['token']) || !isset($input['password'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Token and password are required']);
                return;
            }

            $token = $input['token'];
            $password = $input['password'];

            // Validate password strength
            if (strlen($password) < 8) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters long']);
                return;
            }

            // Validate token
            $tokenData = $this->emailService->validateToken($token);

            if (!$tokenData) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
                return;
            }

            if ($tokenData['type'] !== 'password_setup') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid token type']);
                return;
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Update user password
            $query = "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$hashedPassword, $tokenData['user_id']]);

            // Mark token as used
            $this->emailService->markTokenAsUsed($token);

            echo json_encode([
                'success' => true,
                'message' => 'Password set up successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email is required']);
                return;
            }

            $email = $input['email'];
            $language = $input['language'] ?? 'en'; // Default to English if not provided

            // Get user details
            $query = "SELECT id, email, first_name, last_name FROM users WHERE email = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                // Don't reveal if user exists or not for security
                echo json_encode([
                    'success' => true,
                    'message' => 'If the email exists, a password reset link has been sent'
                ]);
                return;
            }

            // Generate secure token
            $token = $this->emailService->generateSecureToken($user['id'], 'password_reset');
            
            if (!$token) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to generate token']);
                return;
            }

            // Send email
            $userName = trim($user['first_name'] . ' ' . $user['last_name']);
            
            // Temporarily disable email sending for testing - will work once Resend is properly configured
            //$result = ['success' => true, 'message' => 'Password reset token generated successfully'];
            
            // TODO: Uncomment this line once Resend API is properly configured
            $result = $this->emailService->sendPasswordResetEmail($email, $userName, $token, $language);

            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => 'If the email exists, a password reset link has been sent'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $result['message']]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
        }
    }

    /**
     * Reset password using token
     */
    public function resetPassword()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['token']) || !isset($input['password'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Token and password are required']);
                return;
            }

            $token = $input['token'];
            $password = $input['password'];

            // Validate password strength
            if (strlen($password) < 8) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters long']);
                return;
            }

            // Validate token
            $tokenData = $this->emailService->validateToken($token);

            if (!$tokenData) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
                return;
            }

            if ($tokenData['type'] !== 'password_reset') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid token type']);
                return;
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Update user password
            $query = "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$hashedPassword, $tokenData['user_id']]);

            // Mark token as used
            $this->emailService->markTokenAsUsed($token);

            echo json_encode([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
        }
    }
}
