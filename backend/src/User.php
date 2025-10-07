<?php

namespace App;

class User
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO users (first_name, last_name, email, phone, role, password_hash, created_at, updated_at) 
                VALUES (:first_name, :last_name, :email, :phone, :role, :password_hash, NOW(), NOW())";

        $params = [
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role' => $data['role'],
            'password_hash' => $data['password'] ? password_hash($data['password'], PASSWORD_DEFAULT) : null,
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT id, first_name, last_name, email, phone, role, created_at, updated_at 
                FROM users WHERE id = :id";
        
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function findByEmail($email)
    {
        $sql = "SELECT * FROM users WHERE email = :email";
        return $this->db->fetchOne($sql, ['email' => $email]);
    }

    public function getAll()
    {
        $sql = "SELECT id, first_name, last_name, email, phone, role, created_at, updated_at 
                FROM users ORDER BY created_at DESC";
        
        return $this->db->fetchAll($sql);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'firstName') {
                $fields[] = 'first_name = :first_name';
                $params['first_name'] = $value;
            } elseif ($key === 'lastName') {
                $fields[] = 'last_name = :last_name';
                $params['last_name'] = $value;
            } elseif ($key === 'email') {
                $fields[] = 'email = :email';
                $params['email'] = $value;
            } elseif ($key === 'phone') {
                $fields[] = 'phone = :phone';
                $params['phone'] = $value;
            } elseif ($key === 'role') {
                $fields[] = 'role = :role';
                $params['role'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM users WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function verifyPassword($email, $password)
    {
        $user = $this->findByEmail($email);
        if (!$user) {
            return false;
        }

        return password_verify($password, $user['password_hash']);
    }

    public function updatePassword($userId, $hashedPassword)
    {
        $sql = "UPDATE users SET password_hash = :password_hash, updated_at = NOW() WHERE id = :id";
        $params = [
            'password_hash' => $hashedPassword,
            'id' => $userId
        ];
        
        $this->db->query($sql, $params);
        return $this->findById($userId);
    }

    public function formatUser($user)
    {
        return [
            'id' => (int) $user['id'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'avatar_url' => null, // Not in current schema
            'is_active' => true, // Default value
            'last_login' => null, // Not in current schema
            'created_at' => $user['created_at'],
        ];
    }
}
