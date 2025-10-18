# Harvest Notification System Fix

## Issue Summary
The harvest notification system was failing with SQL errors due to missing database columns.

### Error Messages
```
Error processing land 7: Query failed: SQLSTATE[42S22]: Column not found: 1054 Unknown column 'metadata' in 'where clause'
```

### Root Cause
1. The `notifications` table was missing several required columns:
   - `metadata` (JSON column for storing notification metadata)
   - `is_active` (flag for active notifications)
   - `status` (enum for notification status: pending, in_progress, completed, dismissed)
   - `created_by` (user who created the notification)

2. The `NotificationService::createNotification()` method signature didn't match how it was being called by `HarvestNotificationService`

3. The farm work creation was using incorrect field name (`created_by` instead of `creator_user_id`)

## Changes Made

### 1. Database Schema Fix

**File:** `backend/fix_harvest_notification_schema.php`

Created a safe schema update script that:
- Adds `metadata` JSON column to `notifications` table
- Adds `is_active` column to `notifications` table  
- Adds `status` enum column to `notifications` table
- Adds `created_by` column to `notifications` table
- Updates notification `type` enum to include 'harvest' type
- Initializes NULL metadata values to empty JSON objects

**Migration File:** `backend/database/migrations/012_add_metadata_to_notifications.sql`

Created a formal migration file for tracking the schema changes in the migration system.

### 2. NotificationService Update

**File:** `backend/src/NotificationService.php`

Updated the `createNotification()` method to:
- Accept both array parameter and individual parameters (backward compatible)
- Support new columns: metadata, created_by, is_active, status
- Return the full notification record after creation

**Before:**
```php
public function createNotification($landId, $userId, $type, $title, $message, $priority = 'normal')
```

**After:**
```php
public function createNotification($landIdOrData, $userId = null, $type = null, $title = null, $message = null, $priority = 'medium')
{
    // Support both calling patterns: array or individual parameters
    if (is_array($landIdOrData)) {
        // Extract data from array
        ...
    } else {
        // Legacy calling pattern with individual parameters
        ...
    }
}
```

### 3. HarvestNotificationService Updates

**File:** `backend/src/HarvestNotificationService.php`

Fixed two issues:

1. **Notification Creation** - Added `user_id` to notification data:
```php
$notificationData = [
    'title' => $title,
    'message' => $message,
    'type' => 'harvest',
    'priority' => $priority,
    'land_id' => $land['id'],
    'user_id' => $land['created_by'], // Added this line
    'created_by' => $land['created_by'],
    'metadata' => json_encode([...])
];
```

2. **Farm Work Creation** - Changed `created_by` to `creator_user_id`:
```php
$farmWorkData = [
    ...
    'creator_user_id' => $land['created_by'], // Changed from 'created_by'
    ...
];
```

## Testing

Run the harvest notification check:

```bash
cd backend
php check_harvest_notifications.php
```

Expected output:
```
=== Harvest Notification Cron Job Started ===
Execution time: 2025-10-18 09:16:48
Timezone: Asia/Bangkok

Starting harvest notification check at 2025-10-18 09:16:48
Found 8 lands to check
Land คุณ การิน ลิ้มธนาคม (N2): -1 days until harvest
[Notifications and farm works created as expected]
...

=== Execution Summary ===
Success: Yes
Lands processed: 8
Notifications created: X
Notifications updated: X
Farm works created: X
```

## Verification Steps

1. **Check notifications table has new columns:**
```sql
DESCRIBE notifications;
```

2. **Verify notifications are created with metadata:**
```sql
SELECT id, type, title, priority, metadata 
FROM notifications 
WHERE type = 'harvest' 
ORDER BY created_at DESC 
LIMIT 5;
```

3. **Check farm works are created:**
```sql
SELECT id, title, status, creator_user_id, metadata 
FROM farm_works 
WHERE JSON_EXTRACT(metadata, '$.created_from') = 'harvest_notification'
ORDER BY created_at DESC 
LIMIT 5;
```

## Files Modified

1. `backend/src/NotificationService.php` - Updated createNotification method
2. `backend/src/HarvestNotificationService.php` - Fixed notification and farm work data
3. `backend/fix_harvest_notification_schema.php` - Schema fix script (new file)
4. `backend/database/migrations/012_add_metadata_to_notifications.sql` - Migration file (new file)

## Notes

- The fix is backward compatible - existing code calling `NotificationService::createNotification()` with individual parameters will still work
- The schema fix script is safe to run multiple times - it checks for existing columns before adding them
- Farm work creation now includes proper metadata tracking for harvest cycle management
- Notifications now support rich metadata for better tracking and filtering

## Future Improvements

1. Run all pending migrations to ensure database schema is fully up to date
2. Consider adding database indexes for JSON queries on metadata columns
3. Add unit tests for notification and farm work creation
4. Implement notification status sync with farm work status changes

