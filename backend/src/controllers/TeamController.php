<?php

namespace App\Controllers;

use App\Auth;
use App\Team;

class TeamController
{
    private $teamModel;

    public function __construct()
    {
        $this->teamModel = new Team();
    }

    public function index()
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $teams = $this->teamModel->getAll();
        $formattedTeams = array_map([$this->teamModel, 'formatTeam'], $teams);
        
        echo json_encode($formattedTeams);
    }

    public function show($id)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $team = $this->teamModel->findById($id);
        
        if (!$team) {
            http_response_code(404);
            echo json_encode(['error' => 'Team not found']);
            return;
        }

        echo json_encode($this->teamModel->formatTeam($team));
    }

    public function store()
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['name'];

        foreach ($requiredFields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field {$field} is required"]);
                return;
            }
        }

        $input['created_by'] = Auth::requireAuth()['user_id'];
        
        try {
            $team = $this->teamModel->create($input);
            http_response_code(201);
            echo json_encode($this->teamModel->formatTeam($team));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create team: ' . $e->getMessage()]);
        }
    }

    public function update($id)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $team = $this->teamModel->update($id, $input);
            echo json_encode($this->teamModel->formatTeam($team));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update team: ' . $e->getMessage()]);
        }
    }

    public function delete($id)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        try {
            $this->teamModel->delete($id);
            http_response_code(204);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete team: ' . $e->getMessage()]);
        }
    }

    public function addMember($teamId)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['userId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'userId is required']);
            return;
        }

        $role = $input['role'] ?? 'member';
        
        try {
            $this->teamModel->addMember($teamId, $input['userId'], $role);
            echo json_encode(['message' => 'Member added successfully']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add member: ' . $e->getMessage()]);
        }
    }

    public function removeMember($teamId)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['userId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'userId is required']);
            return;
        }
        
        try {
            $this->teamModel->removeMember($teamId, $input['userId']);
            echo json_encode(['message' => 'Member removed successfully']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove member: ' . $e->getMessage()]);
        }
    }

    public function getMembers($teamId)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        try {
            $members = $this->teamModel->getMembers($teamId);
            echo json_encode($members);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get team members: ' . $e->getMessage()]);
        }
    }

    public function getAllMembers()
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        try {
            $members = $this->teamModel->getAllMembers();
            echo json_encode([
                'success' => true,
                'data' => $members
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get all team members: ' . $e->getMessage()]);
        }
    }
}
