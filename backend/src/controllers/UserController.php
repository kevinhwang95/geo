<?php

namespace App\Controllers;

use App\Auth;
use App\User;

class UserController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function index()
    {
        Auth::requireRole('admin');
        
        $users = $this->userModel->getAll();
        $formattedUsers = array_map([$this->userModel, 'formatUser'], $users);
        
        echo json_encode($formattedUsers);
    }

    public function show($id)
    {
        Auth::requireRole('admin');
        
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
        if (!in_array($input['role'], ['admin', 'user'])) {
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

        // Set default password
        $input['password'] = 'defaultpassword123';
        
        try {
            $user = $this->userModel->create($input);
            http_response_code(201);
            echo json_encode($this->userModel->formatUser($user));
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
