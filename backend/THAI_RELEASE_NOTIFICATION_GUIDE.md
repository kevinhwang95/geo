# Thai Release Notification Guide

## Overview
This guide explains how to send release notifications in Thai language using the Chokdee Geo application.

## Problem Solved
Previously, when you selected Thai in the language switcher and sent release notifications, you would receive English templates in production. This has been fixed by:

1. **Adding language parameter support** to the release notification API
2. **Creating Thai email templates** for release notifications
3. **Updating the NotificationController** to pass language preferences to the email service

## How It Works

### 1. API Request Structure
When sending a release notification, include the `language` parameter:

```json
{
  "version": "2.1.0",
  "release_notes": "🎉 New Features\n✨ Enhanced UI\n🔧 Bug Fixes",
  "release_date": "2025-10-10",
  "release_type": "Minor Update",
  "language": "th"
}
```

### 2. Supported Languages
- `en` - English (default)
- `th` - Thai

### 3. Language Validation
- If an unsupported language is provided, it defaults to English
- If no language is provided, it defaults to English

## Usage Instructions

### Frontend Integration
When calling the release notification API from your frontend:

```javascript
const sendReleaseNotification = async (notificationData, language = 'en') => {
  const response = await fetch('/api/notifications/release', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...notificationData,
      language: language // 'en' or 'th'
    })
  });
  
  return response.json();
};

// Usage examples:
// English notification
await sendReleaseNotification(releaseData, 'en');

// Thai notification
await sendReleaseNotification(releaseData, 'th');
```

### Language Switcher Integration
Connect your language switcher to the release notification:

```javascript
// Get current language from your language switcher
const currentLanguage = getCurrentLanguage(); // Returns 'en' or 'th'

// Send notification in the selected language
await sendReleaseNotification(releaseData, currentLanguage);
```

## Database Setup

### 1. Apply the Migration
Run the new migration to add Thai email templates:

```sql
-- Apply the migration
mysql -u root -p your_database < backend/database/migrations/003_add_release_notification_templates.sql
```

### 2. Verify Templates
Check that both English and Thai templates exist:

```sql
SELECT template_key, language_code, subject 
FROM email_templates 
WHERE template_key = 'release_notification' 
ORDER BY language_code;
```

Expected output:
```
template_key          | language_code | subject
release_notification  | en           | New Release Available - Chokdee App {{version}}
release_notification  | th           | เวอร์ชันใหม่พร้อมใช้งาน - แอปโชคดี {{version}}
```

## Email Template Variables

Both English and Thai templates support these variables:

- `{{user_name}}` - Recipient's full name
- `{{version}}` - Release version number
- `{{release_notes}}` - Formatted release notes
- `{{release_date}}` - Release date
- `{{release_type}}` - Type of release (Major, Minor, Patch, etc.)

## API Response

The API response includes information about the language used:

```json
{
  "success": true,
  "message": "Release notification sent to 3 admin users",
  "summary": {
    "total_recipients": 3,
    "successful_sends": 3,
    "failed_sends": 0,
    "language_used": "th"
  },
  "results": [
    {
      "email": "admin@example.com",
      "name": "Admin User",
      "status": "success",
      "message": "Email sent successfully"
    }
  ]
}
```

## Testing

### 1. Test English Notifications
```bash
curl -X POST https://your-api.com/api/notifications/release \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "version": "2.1.0",
    "release_notes": "New features and bug fixes",
    "release_date": "2025-10-10",
    "release_type": "Minor Update",
    "language": "en"
  }'
```

### 2. Test Thai Notifications
```bash
curl -X POST https://your-api.com/api/notifications/release \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "version": "2.1.0",
    "release_notes": "ฟีเจอร์ใหม่และการแก้ไขข้อบกพร่อง",
    "release_date": "2025-10-10",
    "release_type": "การอัปเดตเล็กน้อย",
    "language": "th"
  }'
```

## Troubleshooting

### Issue: Still receiving English emails when language is set to Thai

**Possible causes:**
1. **Migration not applied** - Run the migration script
2. **Template not found** - Check if Thai template exists in database
3. **Language parameter not passed** - Verify the API request includes `language: "th"`
4. **Frontend not sending language parameter** - Check your frontend code

**Solutions:**
1. Apply the migration: `mysql -u root -p your_database < backend/database/migrations/003_add_release_notification_templates.sql`
2. Verify templates exist:
   ```sql
   SELECT * FROM email_templates WHERE template_key = 'release_notification' AND language_code = 'th';
   ```
3. Check API request includes language parameter
4. Update frontend to pass language from language switcher

### Issue: Template fallback to English

If the Thai template is not found, the system will automatically fallback to the English template and log a warning. Check your error logs for messages like:
```
EmailService: Release notification template not found for language 'th', using fallback
```

## Files Modified

1. **`backend/src/Controllers/NotificationController.php`**
   - Added language parameter support
   - Updated `sendReleaseNotification()` method
   - Added language validation and fallback

2. **`backend/database/migrations/003_add_release_notification_templates.sql`**
   - Added English release notification template
   - Added Thai release notification template

3. **`backend/THAI_RELEASE_NOTIFICATION_GUIDE.md`**
   - This documentation file

## Future Enhancements

1. **User Language Preference** - Store user's language preference in the database
2. **More Languages** - Add support for additional languages (Chinese, Japanese, etc.)
3. **Template Management UI** - Create an admin interface for managing email templates
4. **Language Detection** - Automatically detect user's language from browser settings

## Support

If you encounter any issues with Thai release notifications:

1. Check the error logs in your application
2. Verify the database migration was applied successfully
3. Test with both English and Thai language parameters
4. Contact the development team with specific error messages

