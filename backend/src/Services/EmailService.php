<?php

namespace App\Services;

use Exception;
use PDO;

class EmailService
{
    private $db;
    private $apiKey;
    private $fromEmail;
    private $fromName;
    private $appUrl;

    public function __construct()
    {
        $this->db = \App\Database::getInstance();
        
        // Load email configuration from environment with fallbacks
        $this->apiKey = $this->getEnvVar('RESEND_API_KEY', '');
        $this->fromEmail = $this->getEnvVar('FROM_EMAIL', 'noreply@yourdomain.com');
        $this->fromName = $this->getEnvVar('FROM_NAME', 'Chokdee App');
        $this->appUrl = $this->getEnvVar('APP_URL', 'http://localhost:5173');
    }

    /**
     * Get environment variable with fallback
     */
    private function getEnvVar($key, $default = '')
    {
        // Try $_ENV first
        if (isset($_ENV[$key]) && !empty($_ENV[$key])) {
            return $_ENV[$key];
        }
        
        // Try getenv() as fallback
        $value = getenv($key);
        if ($value !== false && !empty($value)) {
            return $value;
        }
        
        // Return default
        return $default;
    }

    /**
     * Send password setup email to new user using Resend API
     */
    public function sendPasswordSetupEmail($userEmail, $userName, $token, $languageCode = 'en')
    {
        $setupUrl = $this->appUrl . '/setup-password?token=' . $token;
        
        // Get template from database with language preference
        $template = $this->getEmailTemplate('password_setup', $languageCode);
        if (!$template) {
            error_log("EmailService: Password setup template not found for language '$languageCode', using fallback");
            return $this->sendPasswordSetupEmailFallback($userEmail, $userName, $token);
        }
        
        // Replace template variables
        $subject = $this->replaceTemplateVariables($template['subject'], [
            'user_name' => $userName,
            'setup_url' => $setupUrl
        ]);
        
        $htmlBody = $this->replaceTemplateVariables($template['html_content'], [
            'user_name' => $userName,
            'setup_url' => $setupUrl
        ]);
        
        $textBody = $this->replaceTemplateVariables($template['text_content'], [
            'user_name' => $userName,
            'setup_url' => $setupUrl
        ]);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Send password reset email using Resend API
     */
    public function sendPasswordResetEmail($userEmail, $userName, $token, $languageCode = 'en')
    {
        $resetUrl = $this->appUrl . '/reset-password?token=' . $token;
        
        // Get template from database with language preference
        $template = $this->getEmailTemplate('password_reset', $languageCode);
        if (!$template) {
            error_log("EmailService: Password reset template not found for language '$languageCode', using fallback");
            return $this->sendPasswordResetEmailFallback($userEmail, $userName, $token);
        }
        
        // Replace template variables
        $subject = $this->replaceTemplateVariables($template['subject'], [
            'user_name' => $userName,
            'reset_url' => $resetUrl
        ]);
        
        $htmlBody = $this->replaceTemplateVariables($template['html_content'], [
            'user_name' => $userName,
            'reset_url' => $resetUrl
        ]);
        
        $textBody = $this->replaceTemplateVariables($template['text_content'], [
            'user_name' => $userName,
            'reset_url' => $resetUrl
        ]);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Send email using Resend API
     */
    private function sendEmailViaResend($toEmail, $toName, $subject, $htmlBody, $textBody)
    {
        try {
            error_log("EmailService: sendEmailViaResend called");
            error_log("EmailService: API Key length: " . strlen($this->apiKey));
            
            if (empty($this->apiKey)) {
                error_log("EmailService: API key is empty");
                return [
                    'success' => false,
                    'message' => 'Resend API key not configured'
                ];
            }

            $data = [
                'from' => $this->fromName . ' <' . $this->fromEmail . '>',
                'to' => [$toEmail],
                'subject' => $subject,
                'html' => $htmlBody,
                'text' => $textBody
            ];

            error_log("EmailService: Sending to: " . $toEmail);
            error_log("EmailService: From: " . $this->fromName . ' <' . $this->fromEmail . '>');
            
            // Encode data to JSON with proper UTF-8 support
            $jsonPayload = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($jsonPayload === false) {
                error_log("EmailService: JSON encoding failed: " . json_last_error_msg());
                return [
                    'success' => false,
                    'message' => 'Email content encoding error'
                ];
            }

            $ch = curl_init();
            if (!$ch) {
                error_log("EmailService: Failed to initialize cURL");
                return [
                    'success' => false,
                    'message' => 'Failed to initialize email service'
                ];
            }
            curl_setopt($ch, CURLOPT_URL, 'https://api.resend.com/emails');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 second timeout
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // 10 second connection timeout
            
            // SSL configuration for local development
            $isLocalDevelopment = (
                ($_ENV['APP_ENV'] ?? '') === 'local' || 
                ($_ENV['APP_ENV'] ?? '') === 'development' ||
                strpos($_ENV['APP_URL'] ?? '', 'localhost') !== false ||
                strpos($_ENV['APP_URL'] ?? '', '127.0.0.1') !== false
            );
            
            if ($isLocalDevelopment) {
                // Disable SSL verification for local development
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                error_log("EmailService: SSL verification disabled for local development");
            } else {
                // Enable SSL verification for production
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
                error_log("EmailService: SSL verification enabled for production");
            }

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            error_log("EmailService: HTTP Code: " . $httpCode);
            error_log("EmailService: Response: " . $response);
            error_log("EmailService: cURL Error: " . $error);

            if ($error) {
                error_log("Resend API cURL error: " . $error);
                return [
                    'success' => false,
                    'message' => 'Email service error: ' . $error
                ];
            }

            $responseData = json_decode($response, true);

            if ($httpCode >= 200 && $httpCode < 300) {
                error_log("Email sent successfully via Resend to: $toEmail, ID: " . ($responseData['id'] ?? 'unknown'));
                return [
                    'success' => true,
                    'message' => 'Email sent successfully',
                    'email_id' => $responseData['id'] ?? null
                ];
            } else {
                error_log("Resend API error: HTTP $httpCode, Response: " . $response);
                return [
                    'success' => false,
                    'message' => 'Email service error: ' . ($responseData['message'] ?? 'Unknown error')
                ];
            }
            
        } catch (Exception $e) {
            error_log("Email sending error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Email sending error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Alternative: Send email using SMTP (for other services)
     */
    private function sendEmailViaSMTP($toEmail, $toName, $subject, $htmlBody, $textBody)
    {
        try {
            $smtpHost = $_ENV['SMTP_HOST'] ?? 'smtp.resend.com';
            $smtpPort = $_ENV['SMTP_PORT'] ?? 587;
            $smtpUsername = $_ENV['SMTP_USERNAME'] ?? '';
            $smtpPassword = $_ENV['SMTP_PASSWORD'] ?? '';

            // Create the email headers
            $headers = [
                'From: ' . $this->fromName . ' <' . $this->fromEmail . '>',
                'Reply-To: ' . $this->fromEmail,
                'MIME-Version: 1.0',
                'Content-Type: multipart/alternative; boundary="boundary123"',
                'X-Mailer: PHP/' . phpversion()
            ];

            // Create the email body
            $emailBody = "--boundary123\r\n";
            $emailBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $emailBody .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
            $emailBody .= $textBody . "\r\n\r\n";
            
            $emailBody .= "--boundary123\r\n";
            $emailBody .= "Content-Type: text/html; charset=UTF-8\r\n";
            $emailBody .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
            $emailBody .= $htmlBody . "\r\n\r\n";
            $emailBody .= "--boundary123--\r\n";

            // Send email using PHP's mail function
            $result = mail($toEmail, $subject, $emailBody, implode("\r\n", $headers));
            
            if ($result) {
                error_log("Email sent successfully to: $toEmail");
                return ['success' => true, 'message' => 'Email sent successfully'];
            } else {
                error_log("Failed to send email to: $toEmail");
                return ['success' => false, 'message' => 'Failed to send email'];
            }
            
        } catch (Exception $e) {
            error_log("Email sending error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Email sending error: ' . $e->getMessage()];
        }
    }

    /**
     * Get email template from database
     */
    private function getEmailTemplate($templateKey, $languageCode = 'en')
    {
        try {
            $sql = "
                SELECT subject, html_content, text_content, variables
                FROM email_templates 
                WHERE template_key = :template_key AND language_code = :language_code AND is_active = 1
                ORDER BY is_base_template DESC, created_at DESC
                LIMIT 1
            ";
            
            $template = $this->db->fetchOne($sql, [
                'template_key' => $templateKey,
                'language_code' => $languageCode
            ]);
            
            if ($template && $template['variables']) {
                $template['variables'] = json_decode($template['variables'], true);
            }
            
            return $template;
        } catch (Exception $e) {
            error_log("EmailService::getEmailTemplate error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Replace template variables with actual values
     */
    private function replaceTemplateVariables($content, $variables)
    {
        foreach ($variables as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $content = str_replace($placeholder, $value, $content);
        }
        return $content;
    }

    /**
     * Fallback password setup email (original hardcoded version)
     */
    private function sendPasswordSetupEmailFallback($userEmail, $userName, $token)
    {
        $setupUrl = $this->appUrl . '/setup-password?token=' . $token;
        $subject = 'Welcome to Chokdee App - Set Up Your Password';
        
        $htmlBody = $this->getPasswordSetupEmailTemplate($userName, $setupUrl);
        $textBody = $this->getPasswordSetupEmailTextTemplate($userName, $setupUrl);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Clean HTML content to ensure it's valid for JSON encoding
     */
    private function cleanHtmlForJson($html)
    {
        // Ensure the content is properly UTF-8 encoded
        if (!mb_check_encoding($html, 'UTF-8')) {
            $html = mb_convert_encoding($html, 'UTF-8', 'auto');
        }
        
        // Remove any null bytes or control characters that could break JSON
        $html = str_replace(["\0", "\x00"], '', $html);
        
        // Remove control characters except newlines and tabs
        $html = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $html);
        
        return $html;
    }

    /**
     * Format release notes with proper HTML line breaks and styling
     */
    public function formatReleaseNotes($releaseNotes)
    {
        // Ensure input is properly UTF-8 encoded
        if (!mb_check_encoding($releaseNotes, 'UTF-8')) {
            $releaseNotes = mb_convert_encoding($releaseNotes, 'UTF-8', 'auto');
        }
        
        // If it's already HTML, return as is
        if (strip_tags($releaseNotes) !== $releaseNotes) {
            return $releaseNotes;
        }
        
        // Convert plain text to HTML with proper formatting
        // Manually escape HTML characters to preserve UTF-8
        $formatted = str_replace(['&', '<', '>', '"', "'"], ['&amp;', '&lt;', '&gt;', '&quot;', '&#39;'], $releaseNotes);
        
        // Convert line breaks to HTML
        $formatted = nl2br($formatted);
        
        // Convert bullet points (•) to proper HTML lists
        $lines = explode('<br />', $formatted);
        $formattedLines = [];
        $inList = false;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Check if line starts with bullet point
            if (preg_match('/^•\s*(.+)$/u', $line, $matches)) {
                if (!$inList) {
                    $formattedLines[] = '<ul style="margin: 10px 0; padding-left: 20px;">';
                    $inList = true;
                }
                $formattedLines[] = '<li style="margin: 5px 0;">' . $matches[1] . '</li>';
            } else {
                if ($inList) {
                    $formattedLines[] = '</ul>';
                    $inList = false;
                }
                
                // Handle section headers (🎉, ✨, 🔧, 🌍, 🏞️)
                if (preg_match('/^([🎉✨🔧🌍🏞️])\s*(.+)$/u', $line, $matches)) {
                    $formattedLines[] = '<h4 style="margin: 20px 0 10px 0; color: #059669; font-size: 16px;">' . $matches[1] . ' ' . $matches[2] . '</h4>';
                } else {
                    $formattedLines[] = '<p style="margin: 10px 0;">' . $line . '</p>';
                }
            }
        }
        
        if ($inList) {
            $formattedLines[] = '</ul>';
        }
        
        return implode("\n", $formattedLines);
    }

    /**
     * Get hardcoded release notification email template (fallback)
     */
    private function getReleaseNotificationEmailTemplate($userName, $variables)
    {
        $version = $variables['version'] ?? 'Unknown';
        $releaseNotes = $variables['release_notes'] ?? 'No release notes provided.';
        $releaseDate = $variables['release_date'] ?? date('Y-m-d');
        $releaseType = $variables['release_type'] ?? 'Update';

        // Format the release notes properly
        $formattedReleaseNotes = $this->formatReleaseNotes($releaseNotes);
        // Clean the formatted HTML to ensure it's valid for JSON encoding
        $formattedReleaseNotes = $this->cleanHtmlForJson($formattedReleaseNotes);

        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Release - Chokdee App</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .version-badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
                .release-notes { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Release Available!</h1>
                    <div class="version-badge">Version ' . htmlspecialchars($version) . '</div>
                </div>
                <div class="content">
                    <h2>Hello ' . htmlspecialchars($userName) . ',</h2>
                    <p>We are excited to announce the release of <strong>Chokdee App ' . htmlspecialchars($version) . '</strong>! This update brings several improvements and new features to enhance your experience.</p>
                    
                    <div class="release-notes">
                        <h3 style="margin-top: 0; color: #059669;">What\'s New in ' . htmlspecialchars($version) . ':</h3>
                        ' . $formattedReleaseNotes . '
                    </div>
                    
                    <p><strong>Release Date:</strong> ' . htmlspecialchars($releaseDate) . '</p>
                    <p><strong>Release Type:</strong> ' . htmlspecialchars($releaseType) . '</p>
                    
                    <p>We encourage all administrators to review the changes and update your systems accordingly.</p>
                </div>
                <div class="footer">
                    <p>This notification was sent to all system administrators.</p>
                    <p>© 2025 Chokdee App. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
    }

    /**
     * Get hardcoded release notification email text template (fallback)
     */
    private function getReleaseNotificationEmailTextTemplate($userName, $variables)
    {
        $version = $variables['version'] ?? 'Unknown';
        $releaseNotes = strip_tags($variables['release_notes'] ?? 'No release notes provided.');
        $releaseDate = $variables['release_date'] ?? date('Y-m-d');
        $releaseType = $variables['release_type'] ?? 'Update';

        return "New Release Available - Chokdee App $version

Hello $userName,

We are excited to announce the release of Chokdee App $version!

What's New:
$releaseNotes

Release Date: $releaseDate
Release Type: $releaseType

Please review the changes and update your systems accordingly.

This notification was sent to all system administrators.

© 2025 Chokdee App. All rights reserved.";
    }

    /**
     * Fallback password reset email (original hardcoded version)
     */
    private function sendPasswordResetEmailFallback($userEmail, $userName, $token)
    {
        $resetUrl = $this->appUrl . '/reset-password?token=' . $token;
        $subject = 'Reset Your Password - Chokdee App';
        
        $htmlBody = $this->getPasswordResetEmailTemplate($userName, $resetUrl);
        $textBody = $this->getPasswordResetEmailTextTemplate($userName, $resetUrl);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Send release notification email to admin users
     */
    public function sendReleaseNotificationEmail($userEmail, $userName, $variables, $languageCode = 'en')
    {
        // Get template from database with language preference
        $template = $this->getEmailTemplate('release_notification', $languageCode);
        if (!$template) {
            error_log("EmailService: Release notification template not found for language '$languageCode', using fallback");
            return $this->sendReleaseNotificationEmailFallback($userEmail, $userName, $variables);
        }
        
        // Format the release notes before replacing template variables
        $formattedVariables = $variables;
        if (isset($formattedVariables['release_notes'])) {
            $formattedReleaseNotes = $this->formatReleaseNotes($formattedVariables['release_notes']);
            // Clean the formatted HTML to ensure it's valid for JSON encoding
            $formattedVariables['release_notes'] = $this->cleanHtmlForJson($formattedReleaseNotes);
        }
        
        // Replace template variables
        $subject = $this->replaceTemplateVariables($template['subject'], $formattedVariables);
        $htmlBody = $this->replaceTemplateVariables($template['html_content'], $formattedVariables);
        $textBody = $this->replaceTemplateVariables($template['text_content'], $formattedVariables);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Fallback release notification email (if template not found)
     */
    private function sendReleaseNotificationEmailFallback($userEmail, $userName, $variables)
    {
        $subject = 'New Release Available - Chokdee App v' . ($variables['version'] ?? 'Unknown');
        
        $htmlBody = $this->getReleaseNotificationEmailTemplate($userName, $variables);
        $textBody = $this->getReleaseNotificationEmailTextTemplate($userName, $variables);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Generate secure token for password setup/reset
     */
    public function generateSecureToken($userId, $type = 'password_setup')
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours')); // Token expires in 24 hours
        
        try {
            // Store token in database
            $sql = "INSERT INTO password_tokens (user_id, token, type, expires_at, created_at) VALUES (:user_id, :token, :type, :expires_at, NOW())";
            $this->db->query($sql, [
                'user_id' => $userId,
                'token' => $token,
                'type' => $type,
                'expires_at' => $expiresAt
            ]);
            
            return $token;
        } catch (Exception $e) {
            error_log("Token generation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Validate token and get user info
     */
    public function validateToken($token)
    {
        try {
            $sql = "
                SELECT pt.*, u.email, u.first_name, u.last_name 
                FROM password_tokens pt
                JOIN users u ON pt.user_id = u.id
                WHERE pt.token = :token AND pt.expires_at > NOW() AND pt.used = 0
            ";
            
            return $this->db->fetchOne($sql, ['token' => $token]);
        } catch (Exception $e) {
            error_log("Token validation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mark token as used
     */
    public function markTokenAsUsed($token)
    {
        try {
            $sql = "UPDATE password_tokens SET used = 1, used_at = NOW() WHERE token = :token";
            $this->db->query($sql, ['token' => $token]);
            
            return true;
        } catch (Exception $e) {
            error_log("Token usage marking error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * HTML template for password setup email
     */
    private function getPasswordSetupEmailTemplate($userName, $setupUrl)
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Welcome to Chokdee App</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .button:hover { background: #6d28d9; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Welcome to Chokdee App!</h1>
                </div>
                <div class='content'>
                    <h2>Hello " . htmlspecialchars($userName) . ",</h2>
                    <p>Welcome to Chokdee App! Your account has been created and you're ready to get started.</p>
                    <p>To complete your registration, please set up your password by clicking the button below:</p>
                    
                    <div style='text-align: center;'>
                        <a href='" . htmlspecialchars($setupUrl) . "' class='button'>Set Up My Password</a>
                    </div>
                    
                    <div class='warning'>
                        <strong>Important:</strong> This link will expire in 24 hours for security reasons. If you don't set up your password within this time, please contact your administrator.
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;'>
                        " . htmlspecialchars($setupUrl) . "
                    </p>
                    
                    <p>If you didn't expect this email, please ignore it or contact support.</p>
                </div>
                <div class='footer'>
                    <p>This email was sent from Chokdee App. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Text template for password setup email
     */
    private function getPasswordSetupEmailTextTemplate($userName, $setupUrl)
    {
        return "
Welcome to Chokdee App!

Hello " . $userName . ",

Welcome to Chokdee App! Your account has been created and you're ready to get started.

To complete your registration, please set up your password by visiting this link:

" . $setupUrl . "

IMPORTANT: This link will expire in 24 hours for security reasons. If you don't set up your password within this time, please contact your administrator.

If you didn't expect this email, please ignore it or contact support.

This email was sent from Chokdee App. Please do not reply to this email.
        ";
    }

    /**
     * HTML template for password reset email
     */
    private function getPasswordResetEmailTemplate($userName, $resetUrl)
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Reset Your Password - Chokdee App</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .button:hover { background: #b91c1c; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Reset Your Password</h1>
                </div>
                <div class='content'>
                    <h2>Hello " . htmlspecialchars($userName) . ",</h2>
                    <p>We received a request to reset your password for your Chokdee App account.</p>
                    <p>To reset your password, please click the button below:</p>
                    
                    <div style='text-align: center;'>
                        <a href='" . htmlspecialchars($resetUrl) . "' class='button'>Reset My Password</a>
                    </div>
                    
                    <div class='warning'>
                        <strong>Important:</strong> This link will expire in 24 hours for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;'>
                        " . htmlspecialchars($resetUrl) . "
                    </p>
                    
                    <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                </div>
                <div class='footer'>
                    <p>This email was sent from Chokdee App. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Text template for password reset email
     */
    private function getPasswordResetEmailTextTemplate($userName, $resetUrl)
    {
        return "
Reset Your Password - Chokdee App

Hello " . $userName . ",

We received a request to reset your password for your Chokdee App account.

To reset your password, please visit this link:

" . $resetUrl . "

IMPORTANT: This link will expire in 24 hours for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

This email was sent from Chokdee App. Please do not reply to this email.
        ";
    }
}