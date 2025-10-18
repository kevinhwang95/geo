# Notification Detail API Fix

## Issue
When clicking on a notification card in the NotificationCenter component, users were getting a "Notification not found" error message, even though the notification existed in the database.

## Root Cause

### Response Structure Mismatch

**Frontend Expected Structure:**
```typescript
// NotificationDetailDialog.tsx lines 76-78
if (response.data.success) {
  setNotification(response.data.data.notification);  // Nested in .notification
  setPhotos(response.data.data.photos || []);       // Separate photos array
}
```

**Backend Original Structure:**
```php
// NotificationController.php (before fix)
echo json_encode([
    'success' => true,
    'data' => $notification  // Direct object, not nested
]);
// Missing photos!
```

The frontend was looking for `response.data.data.notification` but the backend was returning `response.data.data` directly.

## Solution

Updated the `NotificationController::show()` method to:

### 1. Match Frontend Expected Structure

```php
echo json_encode([
    'success' => true,
    'data' => [
        'notification' => $notification,  // ✅ Nested correctly
        'photos' => $photos                // ✅ Added photos array
    ]
]);
```

### 2. Added Additional Land Details

Enhanced the SQL query to include location information:

```php
SELECT 
    n.*,
    l.land_name,
    l.land_code,
    l.location,      // ✅ Added
    l.city,          // ✅ Added
    l.district,      // ✅ Added
    l.province,      // ✅ Added
    ...
```

### 3. Added Photo Support

Fetch recent photos associated with the notification's land:

```php
// Fetch photos uploaded around the time of notification
$photoSql = "
    SELECT 
        lp.id,
        lp.filename as file_name,
        lp.file_path,
        lp.file_size,
        lp.mime_type,
        lp.created_at as uploaded_at  // Use created_at, alias as uploaded_at
    FROM land_photos lp
    WHERE lp.land_id = ?
    AND lp.is_active = 1              // Only active photos
    AND lp.created_at >= DATE_SUB(?, INTERVAL 7 DAY)
    ORDER BY lp.created_at DESC
    LIMIT 10
";
```

This fetches photos from the land that were uploaded within 7 days before the notification was created (relevant photos for harvest notifications, etc.).

### 4. Improved Error Handling

```php
// Before
echo json_encode(['error' => 'Notification not found']);

// After  
echo json_encode([
    'success' => false,
    'error' => 'Notification not found'
]);
```

Now includes `success: false` flag for consistent error handling.

## API Endpoint

**URL:** `GET /notifications/show/{id}`

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "notification": {
      "id": 123,
      "land_id": 45,
      "user_id": 7,
      "type": "harvest",
      "priority": "high",
      "title": "Harvest Overdue - N2",
      "message": "Harvest is overdue...",
      "is_read": false,
      "is_dismissed": false,
      "created_at": "2025-10-18 09:00:00",
      "updated_at": "2025-10-18 09:00:00",
      "land_name": "คุณ การิน ลิ้มธนาคม",
      "land_code": "N2",
      "location": "123 Main St",
      "city": "Bangkok",
      "district": "Chatuchak",
      "province": "Bangkok",
      "user_name": "John Doe"
    },
    "photos": [
      {
        "id": 456,
        "file_name": "harvest_photo.jpg",
        "file_path": "/uploads/photos/harvest_photo.jpg",
        "file_size": 1024567,
        "mime_type": "image/jpeg",
        "uploaded_at": "2025-10-17 14:30:00"
      }
    ]
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Notification not found"
}
```

## Files Modified

1. **backend/src/Controllers/NotificationController.php**
   - Updated `show()` method (lines 455-539)
   - Changed response structure
   - Added location fields to SQL query
   - Added photo fetching logic
   - Improved error responses

## Testing

### Test Steps

1. **View Notification Detail**
   ```bash
   # Login and get auth token
   curl -X GET "http://localhost:8000/api/notifications/show/123" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Expected Response:**
   - `success: true`
   - `data.notification` contains full notification details
   - `data.photos` contains array of related photos
   - Location fields populated (city, district, province)

3. **Frontend Test:**
   - Open NotificationCenter
   - Click on any notification card
   - Detail dialog should open showing:
     - Notification title and message
     - Land information with full address
     - Related photos (if any)
     - No "Notification not found" error

### Test Scenarios

#### ✅ Scenario 1: Harvest Notification (with land)
- Click harvest notification
- Should display land details
- Should display location information
- Should display recent photos if available

#### ✅ Scenario 2: General Notification (no land)
- Click general notification
- Should display notification details
- Photos array will be empty (no land_id)
- Should not show land information section

#### ✅ Scenario 3: Non-existent Notification
- Try to view notification ID that doesn't exist
- Should return 404 with error message
- Frontend should display error dialog

## Benefits

1. ✅ **Fixed Error** - No more "Notification not found" errors
2. ✅ **Enhanced Data** - Location details now included
3. ✅ **Photo Support** - Photos displayed in detail view
4. ✅ **Better UX** - Users can see all relevant information
5. ✅ **Consistent API** - Response structure matches frontend expectations

## Related Components

- **Frontend:**
  - `geocoding/src/components/core/NotificationCenter.tsx`
  - `geocoding/src/components/core/NotificationDetailDialog.tsx`

- **Backend:**
  - `backend/src/Controllers/NotificationController.php`

## Notes

- Photo query fetches photos uploaded within 7 days before notification creation
- Limit of 10 photos to prevent large responses
- Photos are sorted by upload date (newest first)
- If notification has no land_id, photos array will be empty
- Location fields may be NULL for some lands (gracefully handled)

## Bug Fix - Column Name Issue

### Initial Issue
The first version had a SQL error:
```
Column not found: uploaded_at
```

### Root Cause
The `land_photos` table uses `created_at` instead of `uploaded_at`.

### Solution
```php
// Changed from:
lp.uploaded_at
WHERE ... lp.uploaded_at >= ...
ORDER BY lp.uploaded_at

// To:
lp.created_at as uploaded_at  // Alias for frontend compatibility
WHERE ... lp.created_at >= ...
ORDER BY lp.created_at
```

Also added:
- `is_active = 1` filter to only show active photos

## Status

✅ **FIXED** - Notification detail dialog now works correctly
✅ **SQL ERROR FIXED** - Using correct column names (created_at)
✅ **TESTED** - Response structure matches frontend expectations  
✅ **ENHANCED** - Additional data (location, photos) now available
✅ **PRODUCTION READY** 🚀

