# Translation Fix: Critical Priority Level

## Issue
The harvest notification system was creating farm works with "critical" priority level, but the frontend translation files and form validation didn't include this priority option, causing i18next missing key errors:

```
i18next::translator: missingKey en translation createWorkAssignment.critical createWorkAssignment.critical
```

## Root Cause
The backend `HarvestNotificationService.php` creates farm works with these priority levels:
- **critical** - for overdue harvests
- **high** - for harvests 1-2 days away
- **medium** - for harvests 3 days away

However, the frontend only supported:
- low
- medium
- high
- urgent

## Changes Made

### 1. Translation Files

**File:** `geocoding/src/i18n/locales/en.json`
- Added: `"critical": "Critical"`

**File:** `geocoding/src/i18n/locales/th.json`
- Added: `"critical": "วิกฤต"`

### 2. Form Component

**File:** `geocoding/src/components/admin/WorkAssignmentFormDialog.tsx`

**Added to priority select dropdown:**
```tsx
<SelectItem value="critical">{t('createWorkAssignment.critical')}</SelectItem>
```

**Updated validation schema:**
```typescript
priority: z.enum(['low', 'medium', 'high', 'critical', 'urgent']).optional(),
```

## Priority Levels

The complete priority hierarchy is now:

1. **Low** (ต่ำ) - Lowest priority
2. **Medium** (ปานกลาง) - Normal priority
3. **High** (สูง) - Important, needs attention
4. **Critical** (วิกฤต) - **NEW** - Urgent action required, used for overdue items
5. **Urgent** (เร่งด่วน) - Highest priority, time-sensitive

## Usage in Harvest Notification System

The harvest notification cron job automatically assigns priority levels:

| Days Until Harvest | Notification Priority | Farm Work Priority |
|-------------------|----------------------|-------------------|
| Overdue (≤ 0)     | high                 | **critical** ⚠️    |
| 1 day             | high                 | **high**         |
| 2 days            | high                 | **high**         |
| 3 days            | medium               | **medium**       |

## Testing

To verify the fix:

1. **Translation Test:**
   - Open work assignment details for a farm work with "critical" priority
   - Should display "Critical" (English) or "วิกฤต" (Thai)
   - No more i18next missing key errors

2. **Form Test:**
   - Open work assignment creation/edit form
   - The priority dropdown should include "Critical" option
   - Form validation should accept "critical" as valid value

3. **Backend Integration Test:**
   ```bash
   cd backend
   php test_harvest_notification_fresh.php
   ```
   - Overdue harvest notifications should create farm works with "critical" priority
   - These farm works should display properly in the UI without translation errors

## Files Modified

1. `geocoding/src/i18n/locales/en.json` - Added "critical" translation
2. `geocoding/src/i18n/locales/th.json` - Added "critical" translation
3. `geocoding/src/components/admin/WorkAssignmentFormDialog.tsx` - Added to dropdown and validation

## Related Files

- `backend/src/HarvestNotificationService.php` - Creates farm works with "critical" priority
- `geocoding/src/components/admin/WorkAssignmentDetailsModal.tsx` - Displays priority using translations

## Notes

- The "critical" priority is primarily used by automated systems (harvest notifications)
- Users can also manually select "critical" when creating/editing work assignments
- The translation error would only appear when viewing farm works created by the harvest notification system
- This fix ensures consistency between backend priority levels and frontend translations

