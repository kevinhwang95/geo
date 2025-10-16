<?php

namespace App\Controllers;

use App\Auth;
use App\User;
use App\Services\EmailService;

class AuthController
{
    private $userModel;
    private $emailService;

    public function __construct()
    {
        $this->userModel = new User();
        $this->emailService = new EmailService();
    }

    public function login()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required']);
            return;
        }

        $email = $input['email'];
        $password = $input['password'];

        $user = $this->userModel->findByEmail($email);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        // Check if user has a password set
        if (!$user['password_hash']) {
            http_response_code(401);
            echo json_encode(['error' => 'Please set up your password first. Check your email for the setup link.']);
            return;
        }

        if (!$this->userModel->verifyPassword($email, $password)) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        $token = Auth::generateToken($user['id'], $user['role']);

        // Update last login timestamp
        Auth::updateUserLastLogin($user['id']);

        echo json_encode([
            'token' => $token,
            'user' => $this->userModel->formatUser($user)
        ]);
    }

    public function logout()
    {
        // In a real application, you might want to blacklist the token
        echo json_encode(['message' => 'Logged out successfully']);
    }

    public function profile()
    {
        $userData = Auth::requireAuth();
        $user = $this->userModel->findById($userData['user_id']);
        
        echo json_encode($this->userModel->formatUser($user));
    }

    public function updateLanguagePreference()
    {
        $userData = Auth::requireAuth();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['language'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Language is required']);
            return;
        }

        $language = $input['language'];
        
        // Validate language code
        $validLanguages = ['en', 'th'];
        if (!in_array($language, $validLanguages)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid language code. Supported languages: ' . implode(', ', $validLanguages)]);
            return;
        }

        $this->userModel->updateLanguagePreference($userData['user_id'], $language);
        
        echo json_encode([
            'message' => 'Language preference updated successfully',
            'language' => $language
        ]);
    }

    public function register()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email']) || !isset($input['firstName']) || !isset($input['lastName'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email, first name, and last name are required']);
            return;
        }

        $email = $input['email'];
        $firstName = $input['firstName'];
        $lastName = $input['lastName'];
        $phone = $input['phone'] ?? '';
        $role = $input['role'] ?? 'user';

        // Check if user already exists
        if ($this->userModel->findByEmail($email)) {
            http_response_code(409);
            echo json_encode(['error' => 'User with this email already exists']);
            return;
        }

        // Create the user without password (will be set via email confirmation)
        try {
            $userData = [
                'firstName' => $firstName,
                'lastName' => $lastName,
                'email' => $email,
                'phone' => $phone,
                'role' => $role,
                'password' => null // No password initially
            ];
            
            $user = $this->userModel->create($userData);
            
            // Generate secure token for password setup
            $token = $this->emailService->generateSecureToken($user['id'], 'password_setup');
            
            if (!$token) {
                // User created but token generation failed
                error_log("User created but token generation failed for: " . $email);
                echo json_encode([
                    'success' => true,
                    'message' => 'Registration successful! Please contact support for password setup.'
                ]);
                return;
            }
            
            // Send password setup email
            $emailSent = $this->emailService->sendPasswordSetupEmail($email, $firstName . ' ' . $lastName, $token);
            
            if ($emailSent) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Registration successful! Please check your email for a password setup link.'
                ]);
            } else {
                // User created but email failed - still return success but log the issue
                error_log("User created but password setup email failed for: " . $email);
                echo json_encode([
                    'success' => true,
                    'message' => 'Registration successful! Please contact support for password setup.'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
        }
    }

    public function refresh()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['refresh_token'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Refresh token is required']);
            return;
        }

        $refreshToken = $input['refresh_token'];
        $newTokens = Auth::refreshAccessToken($refreshToken);

        if (!$newTokens) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired refresh token']);
            return;
        }

        // Get user info for the response
        $payload = Auth::validateToken($newTokens['access_token']);
        $user = $this->userModel->findById($payload['user_id']);

        echo json_encode([
            'tokens' => $newTokens,
            'user' => $this->userModel->formatUser($user)
        ]);
    }

    /**
     * Setup password for new user using token from email
     */
    public function setupPassword()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['token']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Token and password are required']);
            return;
        }

        $token = $input['token'];
        $password = $input['password'];

        // Validate token
        $tokenData = $this->emailService->validateToken($token);
        if (!$tokenData) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or expired token']);
            return;
        }

        // Validate password strength
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters long']);
            return;
        }

        try {
            // Update user password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $this->userModel->updatePassword($tokenData['user_id'], $hashedPassword);
            
            // Mark token as used
            $this->emailService->markTokenAsUsed($token);
            
            echo json_encode([
                'success' => true,
                'message' => 'Password set successfully. You can now log in.'
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to set password: ' . $e->getMessage()]);
        }
    }

    /**
     * Request password reset
     */
    public function requestPasswordReset()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email is required']);
            return;
        }

        $email = $input['email'];
        $user = $this->userModel->findByEmail($email);
        
        if (!$user) {
            // Don't reveal if email exists or not for security
            echo json_encode([
                'success' => true,
                'message' => 'If the email exists, a password reset link has been sent.'
            ]);
            return;
        }

        try {
            // Generate secure token for password reset
            $token = $this->emailService->generateSecureToken($user['id'], 'password_reset');
            
            if (!$token) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to generate reset token']);
                return;
            }
            
            // Send password reset email
            $userName = $user['first_name'] . ' ' . $user['last_name'];
            $emailResult = $this->emailService->sendPasswordResetEmail($email, $userName, $token);
            
            if ($emailResult['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Password reset link has been sent to your email.'
                ]);
            } else {
                error_log("Failed to send password reset email: " . $emailResult['message']);
                http_response_code(500);
                echo json_encode(['error' => 'Failed to send reset email. Please try again later.']);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to process password reset request: ' . $e->getMessage()]);
        }
    }

    /**
     * Reset password using token from email
     */
    public function resetPassword()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['token']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Token and password are required']);
            return;
        }

        $token = $input['token'];
        $password = $input['password'];

        // Validate token
        $tokenData = $this->emailService->validateToken($token);
        if (!$tokenData || $tokenData['type'] !== 'password_reset') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or expired reset token']);
            return;
        }

        // Validate password strength
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters long']);
            return;
        }

        try {
            // Update user password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $this->userModel->updatePassword($tokenData['user_id'], $hashedPassword);
            
            // Mark token as used
            $this->emailService->markTokenAsUsed($token);
            
            echo json_encode([
                'success' => true,
                'message' => 'Password reset successfully. You can now log in with your new password.'
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to reset password: ' . $e->getMessage()]);
        }
    }
}
