<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use Exception;

class EmailTemplateController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all email templates
     */
    public function index()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $sql = "
                SELECT 
                    id, template_key, subject, html_content, text_content, 
                    variables, description, is_active, language_code,
                    base_template_id, is_base_template,
                    created_at, updated_at, created_by, updated_by
                FROM email_templates 
                WHERE is_active = 1
                ORDER BY template_key, language_code
            ";
            
            $templates = $this->db->fetchAll($sql);

            // Parse JSON variables for each template
            foreach ($templates as &$template) {
                if ($template['variables']) {
                    $template['variables'] = json_decode($template['variables'], true);
                }
            }

            echo json_encode($templates);

        } catch (Exception $e) {
            error_log("EmailTemplateController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch email templates']);
        }
    }

    /**
     * Get a specific email template by ID
     */
    public function show($id)
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $sql = "
                SELECT 
                    id, template_key, subject, html_content, text_content, 
                    variables, description, is_active, language_code,
                    base_template_id, is_base_template,
                    created_at, updated_at, created_by, updated_by
                FROM email_templates 
                WHERE id = :id AND is_active = 1
            ";
            
            $template = $this->db->fetchOne($sql, ['id' => $id]);

            if (!$template) {
                http_response_code(404);
                echo json_encode(['error' => 'Email template not found']);
                return;
            }

            // Parse JSON variables
            if ($template['variables']) {
                $template['variables'] = json_decode($template['variables'], true);
            }

            echo json_encode($template);

        } catch (Exception $e) {
            error_log("EmailTemplateController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch email template']);
        }
    }

    /**
     * Create a new email template
     */
    public function store()
    {
        try {
            $user = Auth::requireAnyRole(['system', 'admin']);

            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $requiredFields = ['template_key', 'subject', 'html_content', 'text_content'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }

            // Validate template_key uniqueness
            $checkSql = "SELECT id FROM email_templates WHERE template_key = :template_key AND language_code = :language_code";
            $existing = $this->db->fetchOne($checkSql, [
                'template_key' => $input['template_key'],
                'language_code' => $input['language_code'] ?? 'en'
            ]);
            
            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Template key already exists for this language']);
                return;
            }

            $sql = "
                INSERT INTO email_templates (
                    template_key, subject, html_content, text_content, 
                    variables, description, is_active, language_code,
                    base_template_id, is_base_template, created_by, updated_by
                ) VALUES (
                    :template_key, :subject, :html_content, :text_content, 
                    :variables, :description, :is_active, :language_code,
                    :base_template_id, :is_base_template, :created_by, :updated_by
                )
            ";
            
            $params = [
                'template_key' => $input['template_key'],
                'subject' => $input['subject'],
                'html_content' => $input['html_content'],
                'text_content' => $input['text_content'],
                'variables' => json_encode($input['variables'] ?? []),
                'description' => $input['description'] ?? null,
                'is_active' => $input['is_active'] ?? 1,
                'language_code' => $input['language_code'] ?? 'en',
                'base_template_id' => $input['base_template_id'] ?? null,
                'is_base_template' => $input['is_base_template'] ?? 0,
                'created_by' => $user['user_id'],
                'updated_by' => $user['user_id']
            ];

            $this->db->query($sql, $params);
            $templateId = $this->db->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Email template created successfully',
                'id' => $templateId
            ]);

        } catch (Exception $e) {
            error_log("EmailTemplateController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create email template']);
        }
    }

    /**
     * Update an email template
     */
    public function update($id)
    {
        try {
            $user = Auth::requireAnyRole(['system', 'admin']);

            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check if template exists
            $checkSql = "SELECT id FROM email_templates WHERE id = :id";
            $existing = $this->db->fetchOne($checkSql, ['id' => $id]);
            
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['error' => 'Email template not found']);
                return;
            }

            // Build update query dynamically
            $updateFields = [];
            $params = ['id' => $id, 'updated_by' => $user['user_id']];
            
            $allowedFields = [
                'template_key', 'subject', 'html_content', 'text_content',
                'variables', 'description', 'is_active', 'language_code',
                'base_template_id', 'is_base_template'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "$field = :$field";
                    if ($field === 'variables') {
                        $params[$field] = json_encode($input[$field]);
                    } else {
                        $params[$field] = $input[$field];
                    }
                }
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid fields to update']);
                return;
            }
            
            $updateFields[] = 'updated_by = :updated_by';
            
            $sql = "UPDATE email_templates SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $this->db->query($sql, $params);

            // Fetch the updated template to return to frontend
            $updatedTemplate = $this->db->fetchOne(
                "SELECT * FROM email_templates WHERE id = :id",
                ['id' => $id]
            );

            // Parse JSON fields
            if ($updatedTemplate && $updatedTemplate['variables']) {
                $updatedTemplate['variables'] = json_decode($updatedTemplate['variables'], true);
            }

            echo json_encode([
                'success' => true,
                'message' => 'Email template updated successfully',
                'data' => $updatedTemplate
            ]);

        } catch (Exception $e) {
            error_log("EmailTemplateController::update error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update email template']);
        }
    }

    /**
     * Delete an email template (soft delete by setting is_active = 0)
     */
    public function delete($id)
    {
        try {
            $user = Auth::requireAnyRole(['system', 'admin']);

            // Check if template exists
            $checkSql = "SELECT id, is_base_template FROM email_templates WHERE id = :id";
            $template = $this->db->fetchOne($checkSql, ['id' => $id]);
            
            if (!$template) {
                http_response_code(404);
                echo json_encode(['error' => 'Email template not found']);
                return;
            }

            // If it's a base template, check if it has translations
            if ($template['is_base_template']) {
                $translationSql = "SELECT COUNT(*) as count FROM email_templates WHERE base_template_id = :base_template_id AND is_active = 1";
                $translationResult = $this->db->fetchOne($translationSql, ['base_template_id' => $id]);
                
                if ($translationResult['count'] > 0) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Cannot delete base template that has active translations']);
                    return;
                }
            }

            // Soft delete by setting is_active = 0
            $sql = "UPDATE email_templates SET is_active = 0, updated_by = :updated_by WHERE id = :id";
            $this->db->query($sql, [
                'id' => $id,
                'updated_by' => $user['user_id']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Email template deleted successfully'
            ]);

        } catch (Exception $e) {
            error_log("EmailTemplateController::delete error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete email template']);
        }
    }

    /**
     * Preview email template with sample data
     */
    public function preview($id)
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);

            $input = json_decode(file_get_contents('php://input'), true);
            $sampleData = $input['sample_data'] ?? [];

            $sql = "
                SELECT html_content, text_content, variables
                FROM email_templates 
                WHERE id = :id AND is_active = 1
            ";
            
            $template = $this->db->fetchOne($sql, ['id' => $id]);

            if (!$template) {
                http_response_code(404);
                echo json_encode(['error' => 'Email template not found']);
                return;
            }

            // Parse variables
            $variables = json_decode($template['variables'], true) ?? [];
            
            // Replace placeholders with sample data
            $htmlContent = $template['html_content'];
            $textContent = $template['text_content'];
            
            foreach ($variables as $key => $description) {
                $placeholder = '{{' . $key . '}}';
                $sampleValue = $sampleData[$key] ?? "[Sample $key]";
                
                $htmlContent = str_replace($placeholder, htmlspecialchars($sampleValue), $htmlContent);
                $textContent = str_replace($placeholder, $sampleValue, $textContent);
            }

            echo json_encode([
                'html_content' => $htmlContent,
                'text_content' => $textContent
            ]);

        } catch (Exception $e) {
            error_log("EmailTemplateController::preview error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to preview email template']);
        }
    }
}
