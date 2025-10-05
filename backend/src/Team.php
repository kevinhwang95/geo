<?php

namespace App;

class Team
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO teams (name, description, team_lead_id, created_by, created_at, updated_at) 
                VALUES (:name, :description, :team_lead_id, :created_by, NOW(), NOW())";

        $params = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'team_lead_id' => $data['team_lead_id'] ?? null,
            'created_by' => $data['created_by'],
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT t.*, 
                       tl.first_name as team_lead_first_name, 
                       tl.last_name as team_lead_last_name,
                       cb.first_name as created_by_first_name,
                       cb.last_name as created_by_last_name,
                       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
                FROM teams t 
                LEFT JOIN users tl ON t.team_lead_id = tl.id 
                LEFT JOIN users cb ON t.created_by = cb.id
                WHERE t.id = :id";
        
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll()
    {
        $sql = "SELECT t.*, 
                       tl.first_name as team_lead_first_name, 
                       tl.last_name as team_lead_last_name,
                       cb.first_name as created_by_first_name,
                       cb.last_name as created_by_last_name,
                       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
                FROM teams t 
                LEFT JOIN users tl ON t.team_lead_id = tl.id 
                LEFT JOIN users cb ON t.created_by = cb.id
                WHERE t.is_active = 1
                ORDER BY t.created_at DESC";
        
        return $this->db->fetchAll($sql);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'name') {
                $fields[] = 'name = :name';
                $params['name'] = $value;
            } elseif ($key === 'description') {
                $fields[] = 'description = :description';
                $params['description'] = $value;
            } elseif ($key === 'team_lead_id' || $key === 'teamLeadId') {
                $fields[] = 'team_lead_id = :team_lead_id';
                $params['team_lead_id'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE teams SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        // Soft delete by setting is_active to false
        $sql = "UPDATE teams SET is_active = 0, updated_at = NOW() WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function addMember($teamId, $userId, $role = 'member')
    {
        $sql = "INSERT INTO team_members (team_id, user_id, role, joined_at, is_active) 
                VALUES (:team_id, :user_id, :role, NOW(), 1)
                ON DUPLICATE KEY UPDATE is_active = 1, role = :role_update";
        
        $params = [
            'team_id' => $teamId,
            'user_id' => $userId,
            'role' => $role,
            'role_update' => $role
        ];
        
        $this->db->query($sql, $params);
        return true;
    }

    public function removeMember($teamId, $userId)
    {
        $sql = "UPDATE team_members SET is_active = 0 WHERE team_id = :team_id AND user_id = :user_id";
        $this->db->query($sql, ['team_id' => $teamId, 'user_id' => $userId]);
        return true;
    }

    public function getMembers($teamId)
    {
        $sql = "SELECT u.id, u.first_name, u.last_name, u.email, u.role as user_role,
                       tm.role as team_role, tm.joined_at
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = :team_id AND tm.is_active = 1
                ORDER BY tm.role DESC, u.first_name ASC";
        
        return $this->db->fetchAll($sql, ['team_id' => $teamId]);
    }

    public function formatTeam($team)
    {
        return [
            'id' => (int) $team['id'],
            'name' => $team['name'],
            'description' => $team['description'],
            'teamLeadId' => $team['team_lead_id'] ? (int) $team['team_lead_id'] : null,
            'teamLeadName' => $team['team_lead_first_name'] && $team['team_lead_last_name'] 
                ? $team['team_lead_first_name'] . ' ' . $team['team_lead_last_name'] 
                : null,
            'createdBy' => (int) $team['created_by'],
            'createdByName' => $team['created_by_first_name'] . ' ' . $team['created_by_last_name'],
            'memberCount' => (int) $team['member_count'],
            'isActive' => (bool) $team['is_active'],
            'createdAt' => $team['created_at'],
            'updatedAt' => $team['updated_at'],
        ];
    }
}
