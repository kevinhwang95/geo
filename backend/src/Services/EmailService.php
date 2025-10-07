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
        $this->db = \App\Database::getInstance()->getConnection();
        
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
    public function sendPasswordSetupEmail($userEmail, $userName, $token)
    {
        $setupUrl = $this->appUrl . '/setup-password?token=' . $token;
        
        $subject = 'Welcome to Chokdee App - Set Up Your Password';
        
        $htmlBody = $this->getPasswordSetupEmailTemplate($userName, $setupUrl);
        $textBody = $this->getPasswordSetupEmailTextTemplate($userName, $setupUrl);
        
        return $this->sendEmailViaResend($userEmail, $userName, $subject, $htmlBody, $textBody);
    }

    /**
     * Send password reset email using Resend API
     */
    public function sendPasswordResetEmail($userEmail, $userName, $token)
    {
        $resetUrl = $this->appUrl . '/reset-password?token=' . $token;
        
        $subject = 'Reset Your Password - Chokdee App';
        
        $htmlBody = $this->getPasswordResetEmailTemplate($userName, $resetUrl);
        $textBody = $this->getPasswordResetEmailTextTemplate($userName, $resetUrl);
        
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
            error_log("EmailService: API Key: " . substr($this->apiKey, 0, 10) . "...");

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
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
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
     * Generate secure token for password setup/reset
     */
    public function generateSecureToken($userId, $type = 'password_setup')
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours')); // Token expires in 24 hours
        
        try {
            // Store token in database
            $query = "INSERT INTO password_tokens (user_id, token, type, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$userId, $token, $type, $expiresAt]);
            
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
            $query = "
                SELECT pt.*, u.email, u.first_name, u.last_name 
                FROM password_tokens pt
                JOIN users u ON pt.user_id = u.id
                WHERE pt.token = ? AND pt.expires_at > NOW() AND pt.used = 0
            ";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$token]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
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
            $query = "UPDATE password_tokens SET used = 1, used_at = NOW() WHERE token = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$token]);
            
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