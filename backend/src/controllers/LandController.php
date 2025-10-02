<?php

namespace App\Controllers;

use App\Auth;
use App\Land;

class LandController
{
    private $landModel;

    public function __construct()
    {
        $this->landModel = new Land();
    }

    public function index()
    {
        $lands = $this->landModel->getAll();
        $formattedLands = array_map([$this->landModel, 'formatLand'], $lands);
        
        echo json_encode($formattedLands);
    }

    public function show($id)
    {
        $land = $this->landModel->findById($id);
        
        if (!$land) {
            http_response_code(404);
            echo json_encode(['error' => 'Land not found']);
            return;
        }

        echo json_encode($this->landModel->formatLand($land));
    }

    public function store()
    {
        $userData = Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = [
            'landName', 'landCode', 'deedNumber', 'location',
            'province', 'district', 'city', 'plantType', 'category',
            'plantYear', 'harvestCycle', 'geometry', 'size'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field {$field} is required"]);
                return;
            }
        }

        $input['createdBy'] = $userData['user_id'];
        
        try {
            $land = $this->landModel->create($input);
            http_response_code(201);
            echo json_encode($this->landModel->formatLand($land));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create land: ' . $e->getMessage()]);
        }
    }

    public function update($id)
    {
        $userData = Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $land = $this->landModel->update($id, $input);
            echo json_encode($this->landModel->formatLand($land));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update land: ' . $e->getMessage()]);
        }
    }

    public function delete($id)
    {
        Auth::requireRole('admin');
        
        try {
            $this->landModel->delete($id);
            http_response_code(204);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete land: ' . $e->getMessage()]);
        }
    }
}
