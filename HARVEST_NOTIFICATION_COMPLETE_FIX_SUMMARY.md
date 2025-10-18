# Harvest Notification System - Complete Fix Summary

## Session Overview
Fixed multiple issues in the harvest notification cron job system to ensure it properly creates both notifications AND farm work records automatically.

---

## Issue 1: Missing Database Columns ❌ → ✅

### Error
```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'metadata' in 'where clause'
```

### Root Cause
The `notifications` table was missing several required columns that the harvest notification service was trying to use.

### Solution
**Created:** `backend/fix_harvest_notification_schema.php`
- Safe schema update script that checks for existing columns before adding
- Can be run multiple times without errors

**Created:** `backend/database/migrations/012_add_metadata_to_notifications.sql`
- Formal migration file for tracking changes

**Added to notifications table:**
- `metadata` (JSON) - Stores harvest date, days until harvest, etc.
- `is_active` (tinyint) - Flag for active notifications
- `status` (enum) - pending, in_progress, completed, dismissed
- `created_by` (int) - User who created the notification
- Updated `type` enum to include 'harvest'

### Result
✅ Schema updated successfully, all harvest notifications now store metadata properly

---

## Issue 2: NotificationService Method Signature Mismatch ❌ → ✅

### Error
```
ArgumentCountError: Too few arguments to function App\NotificationService::createNotification(), 
1 passed (array) but at least 5 expected (individual parameters)
```

### Root Cause
`HarvestNotificationService` was calling `createNotification()` with an array, but the method expected individual parameters.

### Solution
**Modified:** `backend/src/NotificationService.php`

Updated `createNotification()` to support both calling patterns:

```php
public function createNotification($landIdOrData, $userId = null, ...)
{
    // Support both calling patterns: array or individual parameters
    if (is_array($landIdOrData)) {
        // Extract data from array
        $data = $landIdOrData;
        // ... handle array format
    } else {
        // Legacy calling pattern with individual parameters
        // ... handle individual parameters
    }
}
```

### Result
✅ Backward compatible - supports both array and individual parameter calls
✅ Returns full notification record after creation

---

## Issue 3: Farm Work Creation Field Mismatch ❌ → ✅

### Error
```
Column 'creator_user_id' cannot be null
Warning: Undefined array key "creator_user_id"
```

### Root Cause
Farm work data was using `created_by` but the database table requires `creator_user_id`.

### Solution
**Modified:** `backend/src/HarvestNotificationService.php`

Changed farm work data structure:
```php
$farmWorkData = [
    // ... other fields
    'creator_user_id' => $land['created_by'], // Changed from 'created_by'
    // ...
];
```

Also added `user_id` to notification data:
```php
$notificationData = [
    // ... other fields
    'user_id' => $land['created_by'], // User to receive notification
    'created_by' => $land['created_by'], // User who created notification
    // ...
];
```

### Result
✅ Farm works now created successfully with proper user tracking

---

## Issue 4: Farm Works Only Created for 3-Day Notifications ❌ → ✅

### Problem
Farm work was only created when harvest was **exactly 3 days away**, but should be created for ALL harvest notifications (overdue, 1 day, 2 days, 3 days).

### Root Cause
Restrictive condition in code:
```php
// OLD CODE - only 3 days
if ($notificationResult['created'] > 0 && $daysUntilHarvest == 3) {
    $farmWorkResult = $this->createHarvestFarmWork($land);
}
```

### Solution
**Modified:** `backend/src/HarvestNotificationService.php`

```php
// NEW CODE - all notifications
if ($notificationResult['created'] > 0) {
    $farmWorkResult = $this->createHarvestFarmWork($land);
}
```

Also added dynamic priority calculation:
```php
$priorityLevel = 'medium'; // default
if ($daysUntilHarvest <= 0) {
    $priorityLevel = 'critical'; // Overdue
} elseif ($daysUntilHarvest == 1) {
    $priorityLevel = 'high'; // 1 day before
} elseif ($daysUntilHarvest == 2) {
    $priorityLevel = 'high'; // 2 days before
}
```

### Test Results

**Before Fix:**
- 5 notifications created ✓
- 1 farm work created (only N7 at 3 days)

**After Fix:**
- 5 notifications created ✓
- **5 farm works created** ✓
  - N2 (overdue -1 day): **CRITICAL** priority
  - N3 (overdue -1 day): **CRITICAL** priority
  - N6 (overdue -2 days): **CRITICAL** priority
  - N1 (1 day): **HIGH** priority
  - N7 (3 days): **MEDIUM** priority

### Result
✅ Farm works now created for ALL harvest notifications with appropriate priority levels

---

## Issue 5: Missing Translation for "Critical" Priority ❌ → ✅

### Error
```
i18next::translator: missingKey en translation createWorkAssignment.critical
```

### Root Cause
Backend creates farm works with "critical" priority, but frontend translation files only had:
- low, medium, high, urgent

### Solution

**Modified:** `geocoding/src/i18n/locales/en.json`
```json
"critical": "Critical",
```

**Modified:** `geocoding/src/i18n/locales/th.json`
```json
"critical": "วิกฤต",
```

**Modified:** `geocoding/src/components/admin/WorkAssignmentFormDialog.tsx`
- Added to priority select dropdown
- Updated validation schema:
  ```typescript
  priority: z.enum(['low', 'medium', 'high', 'critical', 'urgent']).optional(),
  ```

### Result
✅ No more translation errors
✅ "Critical" priority displays correctly in English and Thai
✅ Form validation accepts "critical" as valid value

---

## Complete Priority Hierarchy

| Priority | English | Thai | Usage |
|----------|---------|------|-------|
| Low | Low | ต่ำ | Lowest priority |
| Medium | Medium | ปานกลาง | Normal priority |
| High | High | สูง | Important |
| **Critical** | **Critical** | **วิกฤต** | Overdue/Urgent action required |
| Urgent | Urgent | เร่งด่วน | Highest priority |

---

## Harvest Notification Logic

| Days Until Harvest | Notification Priority | Farm Work Priority | Action |
|-------------------|----------------------|-------------------|--------|
| ≤ 0 (Overdue)     | high                 | **critical** ⚠️    | Immediate action |
| 1 day             | high                 | **high** 🔴       | Prepare now |
| 2 days            | high                 | **high** 🔴       | Prepare soon |
| 3 days            | medium               | **medium** 🟡     | Plan activities |
| > 3 days          | _(no notification)_  | _(no farm work)_  | Monitor |

---

## Files Created

1. **backend/fix_harvest_notification_schema.php** - Database schema fix script
2. **backend/database/migrations/012_add_metadata_to_notifications.sql** - Migration file
3. **backend/test_harvest_notification_fresh.php** - Test script
4. **backend/HARVEST_NOTIFICATION_FIX.md** - Backend fix documentation
5. **geocoding/TRANSLATION_FIX_CRITICAL_PRIORITY.md** - Translation fix documentation
6. **HARVEST_NOTIFICATION_COMPLETE_FIX_SUMMARY.md** - This comprehensive summary

---

## Files Modified

### Backend
1. **backend/src/NotificationService.php** - Enhanced createNotification method
2. **backend/src/HarvestNotificationService.php** - Fixed notification/farm work creation logic

### Frontend
3. **geocoding/src/i18n/locales/en.json** - Added "critical" translation
4. **geocoding/src/i18n/locales/th.json** - Added "critical" translation
5. **geocoding/src/components/admin/WorkAssignmentFormDialog.tsx** - Added critical priority option

---

## Testing & Verification

### Run Harvest Notification Check
```bash
cd backend
php check_harvest_notifications.php
```

### Run Fresh Test
```bash
cd backend
php test_harvest_notification_fresh.php
```

### Expected Output
```
✅ SUCCESS: Both notifications and farm works are working correctly!

📧 Notifications Created: 5
🚜 Farm Works Created: 5

- All overdue harvests get CRITICAL priority farm works
- All 1-2 day harvests get HIGH priority farm works  
- All 3 day harvests get MEDIUM priority farm works
- No translation errors in UI
```

### Verify in Database
```sql
-- Check notifications with metadata
SELECT id, type, title, priority, metadata 
FROM notifications 
WHERE type = 'harvest' 
ORDER BY created_at DESC;

-- Check farm works created by harvest notifications
SELECT id, title, priority_level, status, metadata 
FROM farm_works 
WHERE JSON_EXTRACT(metadata, '$.created_from') = 'harvest_notification'
ORDER BY created_at DESC;
```

---

## Production Deployment Checklist

- [x] Database schema updated (run fix_harvest_notification_schema.php)
- [x] Backend code updated (NotificationService, HarvestNotificationService)
- [x] Frontend translations added (en.json, th.json)
- [x] Frontend form component updated (validation + UI)
- [x] All tests passing (no SQL errors, no translation errors)
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Setup cron job (if not already running)
- [ ] Monitor first execution for any issues
- [ ] Verify notifications and farm works appear in UI

---

## Cron Job Setup

The harvest notification check should run daily. Recommended schedule:

```bash
# Run at 6 AM Bangkok time (23:00 UTC previous day)
0 6 * * * cd /path/to/backend && php check_harvest_notifications.php >> /var/log/harvest_notifications.log 2>&1
```

See `backend/setup_harvest_cron.php` for automated cron setup.

---

## Success Metrics ✅

✅ **No more SQL errors** - All required database columns exist
✅ **Notifications created** - All harvests within 3 days get notifications
✅ **Farm works created** - All notifications generate farm work records
✅ **Proper priorities** - Overdue=critical, 1-2 days=high, 3 days=medium
✅ **No translation errors** - "Critical" priority displays in both languages
✅ **Metadata tracking** - Rich data stored for reporting and filtering
✅ **Duplicate prevention** - Won't create multiple notifications/works for same harvest

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   HARVEST NOTIFICATION SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌─────────────────────────────────────┐
│   CRON JOB       │      │   HarvestNotificationService        │
│                  │─────▶│                                     │
│  Runs Daily      │      │  • Check all lands                  │
│  6 AM Bangkok    │      │  • Calculate days until harvest     │
└──────────────────┘      │  • Create/update notifications      │
                          │  • Create farm works                │
                          └──────────────┬──────────────────────┘
                                         │
                          ┌──────────────┴──────────────────────┐
                          │                                     │
                          ▼                                     ▼
              ┌─────────────────────┐              ┌──────────────────────┐
              │  NotificationService │              │ FarmWorkNotification │
              │                      │              │       Service        │
              │  • Create notification│              │                      │
              │  • Store metadata    │              │  • Create farm work  │
              │  • Set priority      │              │  • Set priority      │
              └──────────┬───────────┘              │  • Store metadata    │
                         │                          └──────────┬───────────┘
                         │                                     │
                         ▼                                     ▼
              ┌─────────────────────┐              ┌──────────────────────┐
              │   notifications     │              │     farm_works       │
              │     table           │              │       table          │
              │                     │              │                      │
              │  • metadata (JSON)  │              │  • metadata (JSON)   │
              │  • is_active        │              │  • priority_level    │
              │  • status           │              │  • creator_user_id   │
              │  • created_by       │              │  • due_date          │
              └─────────────────────┘              └──────────────────────┘
                         │                                     │
                         └──────────────┬──────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │     FRONTEND UI             │
                         │                             │
                         │  • Notifications list       │
                         │  • Farm work assignments    │
                         │  • Translations (en/th)     │
                         │  • Priority displays        │
                         └─────────────────────────────┘
```

---

## Summary

The harvest notification system is now **fully functional** and will:

1. ✅ Check all lands daily for upcoming harvests
2. ✅ Create notifications 3 days before, 1 day before, and for overdue harvests
3. ✅ Automatically create farm work records for each notification
4. ✅ Assign appropriate priority levels (critical → high → medium)
5. ✅ Store rich metadata for tracking and reporting
6. ✅ Display properly in the UI with correct translations
7. ✅ Prevent duplicates for the same harvest cycle

**Status: PRODUCTION READY** 🚀

