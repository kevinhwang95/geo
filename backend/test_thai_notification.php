<?php
/**
 * Test script for Thai Release Notification
 * This script helps test the Thai email template functionality
 */

// Load environment variables
require_once __DIR__ . '/config/load_env.php';

// Load the application
require_once __DIR__ . '/src/autoload.php';

use App\Database;
use App\Services\EmailService;

try {
    echo "=== Thai Release Notification Test ===\n\n";
    
    // Initialize services
    $db = Database::getInstance();
    $emailService = new EmailService();
    
    // Test 1: Check if Thai template exists
    echo "1. Checking if Thai release notification template exists...\n";
    $sql = "SELECT id, subject, language_code FROM email_templates WHERE template_key = 'release_notification' AND language_code = 'th'";
    $thaiTemplate = $db->fetchOne($sql);
    
    if ($thaiTemplate) {
        echo "✅ Thai template found: {$thaiTemplate['subject']}\n";
    } else {
        echo "❌ Thai template not found. Please run the migration first.\n";
        echo "   Run: mysql -u root -p your_database < backend/database/migrations/003_add_release_notification_templates.sql\n\n";
        exit(1);
    }
    
    // Test 2: Check if English template exists
    echo "\n2. Checking if English release notification template exists...\n";
    $sql = "SELECT id, subject, language_code FROM email_templates WHERE template_key = 'release_notification' AND language_code = 'en'";
    $englishTemplate = $db->fetchOne($sql);
    
    if ($englishTemplate) {
        echo "✅ English template found: {$englishTemplate['subject']}\n";
    } else {
        echo "❌ English template not found.\n";
    }
    
    // Test 3: Test template retrieval
    echo "\n3. Testing template retrieval...\n";
    
    // Test English template
    $reflection = new ReflectionClass($emailService);
    $method = $reflection->getMethod('getEmailTemplate');
    $method->setAccessible(true);
    
    $englishTemplateData = $method->invoke($emailService, 'release_notification', 'en');
    if ($englishTemplateData) {
        echo "✅ English template retrieved successfully\n";
    } else {
        echo "❌ Failed to retrieve English template\n";
    }
    
    // Test Thai template
    $thaiTemplateData = $method->invoke($emailService, 'release_notification', 'th');
    if ($thaiTemplateData) {
        echo "✅ Thai template retrieved successfully\n";
        echo "   Subject: {$thaiTemplateData['subject']}\n";
    } else {
        echo "❌ Failed to retrieve Thai template\n";
    }
    
    // Test 4: Test template variable replacement
    echo "\n4. Testing template variable replacement...\n";
    
    if ($thaiTemplateData) {
        $variables = [
            'user_name' => 'ทดสอบ ผู้ใช้',
            'version' => '2.1.0',
            'release_notes' => 'ฟีเจอร์ใหม่และการปรับปรุง',
            'release_date' => '2025-10-10',
            'release_type' => 'การอัปเดตเล็กน้อย'
        ];
        
        $replaceMethod = $reflection->getMethod('replaceTemplateVariables');
        $replaceMethod->setAccessible(true);
        
        $subject = $replaceMethod->invoke($emailService, $thaiTemplateData['subject'], $variables);
        echo "✅ Thai subject with variables: {$subject}\n";
    }
    
    // Test 5: List all available templates
    echo "\n5. Available email templates:\n";
    $sql = "SELECT template_key, language_code, subject, is_active FROM email_templates ORDER BY template_key, language_code";
    $templates = $db->fetchAll($sql);
    
    foreach ($templates as $template) {
        $status = $template['is_active'] ? '✅' : '❌';
        echo "   {$status} {$template['template_key']} ({$template['language_code']}): {$template['subject']}\n";
    }
    
    echo "\n=== Test Complete ===\n";
    echo "If all tests pass, your Thai release notification system is ready to use!\n";
    echo "Make sure to deploy the updated NotificationController.php to production.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

