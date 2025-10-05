<?php

namespace App\Controllers;

use App\Auth;
use App\User;

class AuthController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
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

        if (!$this->userModel->verifyPassword($email, $password)) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        $user = $this->userModel->findByEmail($email);
        $token = Auth::generateToken($user['id'], $user['role']);

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

    public function register()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email']) || !isset($input['password']) || !isset($input['firstName']) || !isset($input['lastName'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email, password, first name, and last name are required']);
            return;
        }

        $email = $input['email'];
        $password = $input['password'];
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

        // Create the user
        try {
            $userData = [
                'firstName' => $firstName,
                'lastName' => $lastName,
                'email' => $email,
                'phone' => $phone,
                'role' => $role,
                'password' => $password
            ];
            
            $user = $this->userModel->create($userData);
            $token = Auth::generateToken($user['id'], $user['role']);

            echo json_encode([
                'token' => $token,
                'user' => $this->userModel->formatUser($user)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
        }
    }

    public function refresh()
    {
        $userData = Auth::requireAuth();
        $user = $this->userModel->findById($userData['user_id']);
        $token = Auth::generateToken($user['id'], $user['role']);

        echo json_encode([
            'token' => $token,
            'user' => $this->userModel->formatUser($user)
        ]);
    }
}
