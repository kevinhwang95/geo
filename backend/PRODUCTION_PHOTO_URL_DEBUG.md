# Production Photo URL Debug Guide

## Issue Description
Photos are returning 422 errors because URLs are using the wrong domain:
- **Wrong URL**: `https://geo.chokdeepalmoil.com/uploads/68e0815d44f40_kalen-emsley-Bkci_8qcdvQ-unsplash.jpg`
- **Correct URL**: `https://geoapi.chokdeepalmoil.com/uploads/68e0815d44f40_kalen-emsley-Bkci_8qcdvQ-unsplash.jpg`

## Root Cause Analysis

### Backend Issue
The `PhotoController.php` is generating relative URLs like `/uploads/photos/filename.jpg` without the proper domain prefix.

### Frontend Issue  
The frontend is using `VITE_API_BASE_UPLOAD` environment variable to construct full URLs, but this variable is likely set to the wrong domain.

## Debugging Steps

### 1. Run the Debug Script
Execute the debug script to see current URL construction:
```bash
curl https://geoapi.chokdeepalmoil.com/debug_photo_urls.php
```

This will show:
- Current request information
- Environment variables
- Different URL construction methods
- File existence checks
- Recommendations

### 2. Check Environment Variables
Look for these environment variables in your production setup:

**Backend (.env file):**
```env
BASE_URL=https://geoapi.chokdeepalmoil.com
# OR
API_BASE_URL=https://geoapi.chokdeepalmoil.com
```

**Frontend (.env file):**
```env
VITE_API_BASE_UPLOAD=https://geoapi.chokdeepalmoil.com
```

### 3. Test the Enhanced PhotoController
Replace your current PhotoController with the enhanced version that includes proper URL construction:

```bash
# Backup current controller
cp src/Controllers/PhotoController.php src/Controllers/PhotoController.php.backup

# Test the enhanced version
php enhanced_photo_controller.php
```

### 4. Update PhotoController.php
Modify your existing `src/Controllers/PhotoController.php` to include proper URL construction:

```php
// Add this method to PhotoController class
private function getBaseUrl()
{
    // Check if BASE_URL is set in environment
    if (!empty($_ENV['BASE_URL'])) {
        return rtrim($_ENV['BASE_URL'], '/');
    }
    
    // Check if API_BASE_URL is set
    if (!empty($_ENV['API_BASE_URL'])) {
        return rtrim($_ENV['API_BASE_URL'], '/');
    }
    
    // Fallback to constructing from current request
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    return $protocol . '://' . $host;
}

// Update the getPhoto method
public function getPhoto($id)
{
    // ... existing code ...
    
    // Convert file path to full URL with proper domain
    $photo['url'] = $this->getBaseUrl() . '/uploads/photos/' . $photo['filename'];
    
    // ... rest of existing code ...
}

// Update the upload method
public function upload()
{
    // ... existing code ...
    
    // Return full URL with proper domain
    $photoUrl = $this->getBaseUrl() . '/uploads/photos/' . $filename;
    
    echo json_encode([
        'success' => true,
        'message' => 'Photo uploaded successfully',
        'data' => [
            'id' => $photoId,
            'filename' => $filename,
            'url' => $photoUrl,  // Use full URL here
            'location' => $exifData
        ]
    ]);
}
```

### 5. Verify Frontend Environment
Check your frontend build environment variables:

```bash
# In your frontend build process, ensure:
VITE_API_BASE_UPLOAD=https://geoapi.chokdeepalmoil.com
```

### 6. Test Photo URLs
After making changes, test with a real photo:

```bash
# Test photo upload
curl -X POST https://geoapi.chokdeepalmoil.com/api/photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "land_id=1" \
  -F "photo=@test.jpg"

# Test photo retrieval
curl https://geoapi.chokdeepalmoil.com/api/photos/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Quick Fix Options

### Option 1: Environment Variable (Recommended)
Set the `BASE_URL` environment variable in your production backend:
```env
BASE_URL=https://geoapi.chokdeepalmoil.com
```

### Option 2: Frontend Fix
Update your frontend environment variable:
```env
VITE_API_BASE_UPLOAD=https://geoapi.chokdeepalmoil.com
```

### Option 3: Hardcode Fix (Not Recommended)
Temporarily hardcode the correct domain in PhotoController.php:
```php
$photo['url'] = 'https://geoapi.chokdeepalmoil.com/uploads/photos/' . $photo['filename'];
```

## Monitoring
After implementing the fix:

1. Check error logs for any URL construction issues
2. Monitor photo loading success rates
3. Verify that photos load correctly in the frontend
4. Test photo upload and retrieval workflows

## Files Modified
- `backend/src/Controllers/PhotoController.php` - Add proper URL construction
- `backend/.env` - Add BASE_URL environment variable
- `geocoding/.env` - Update VITE_API_BASE_UPLOAD variable

## Debug Files Created
- `backend/debug_photo_urls.php` - Debug script for URL construction
- `backend/enhanced_photo_controller.php` - Enhanced controller with proper URL handling

