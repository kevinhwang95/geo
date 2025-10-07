<?php

namespace App\Controllers;

use App\Auth;
use App\User;
use App\Services\EmailService;

class UserController
{
    private $userModel;
    private $emailService;

    public function __construct()
    {
        $this->userModel = new User();
        $this->emailService = new EmailService();
    }

    public function index()
    {
        //Auth::requireRole('admin');
        
        $users = $this->userModel->getAll();
        $formattedUsers = array_map([$this->userModel, 'formatUser'], $users);
        
        echo json_encode($formattedUsers);
    }

    public function show($id)
    {
        // Use hybrid permission system - check endpoint permissions first, fallback to admin role
        Auth::requireEndpointPermissionWithFallback('users.show', 'admin');
        
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        echo json_encode($this->userModel->formatUser($user));
    }

    public function store()
    {
        Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role'];

        foreach ($requiredFields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field {$field} is required"]);
                return;
            }
        }

        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }

        // Validate role
        if (!in_array($input['role'], ['system', 'admin', 'contributor', 'user', 'team_lead'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid role']);
            return;
        }

        // Check if email already exists
        if ($this->userModel->findByEmail($input['email'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            return;
        }

        // Don't set a password - user will set it via email confirmation
        $input['password'] = null;
        
        try {
            $user = $this->userModel->create($input);
            
            // Generate secure token for password setup
            $token = $this->emailService->generateSecureToken($user['id'], 'password_setup');
            
            if (!$token) {
                // If token generation fails, we should still create the user but log the error
                error_log("Failed to generate password setup token for user: " . $user['id']);
                http_response_code(201);
                echo json_encode([
                    'user' => $this->userModel->formatUser($user),
                    'warning' => 'User created but password setup email could not be sent. Please contact support.'
                ]);
                return;
            }
            
            // Send password setup email
            $userName = $input['firstName'] . ' ' . $input['lastName'];
            $emailResult = $this->emailService->sendPasswordSetupEmail($input['email'], $userName, $token);
            
            if ($emailResult['success']) {
                http_response_code(201);
                echo json_encode([
                    'user' => $this->userModel->formatUser($user),
                    'message' => 'User created successfully. Password setup email has been sent.',
                    'email_sent' => true
                ]);
            } else {
                // Email failed but user was created
                error_log("Failed to send password setup email: " . $emailResult['message']);
                http_response_code(201);
                echo json_encode([
                    'user' => $this->userModel->formatUser($user),
                    'warning' => 'User created but password setup email failed to send: ' . $emailResult['message'],
                    'email_sent' => false
                ]);
            }
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
        }
    }

    public function update($id)
    {
        Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $user = $this->userModel->update($id, $input);
            echo json_encode($this->userModel->formatUser($user));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update user: ' . $e->getMessage()]);
        }
    }

    public function delete($id)
    {
        Auth::requireRole('admin');
        
        try {
            $this->userModel->delete($id);
            http_response_code(204);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]);
        }
    }
}
