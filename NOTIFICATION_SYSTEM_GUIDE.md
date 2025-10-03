# 📱 Backend Notification System Guide (Without SMS)

## Overview

Your geo project now has a comprehensive notification system that can send various types of notifications to users without requiring SMS. The system includes:

- ✅ **Database-driven notifications** stored in MySQL
- ✅ **Real-time frontend display** with filtering and management
- ✅ **Automatic harvest notifications** based on due dates
- ✅ **Priority-based notifications** (High, Medium, Low)
- ✅ **Multiple notification types** (Harvest, Maintenance, Comments, Photos, Weather, System)
- ✅ **Cron job automation** for scheduled notifications
- ✅ **Admin controls** for system-wide notifications

## 🏗️ System Architecture

### Backend Components

1. **NotificationService** (`src/NotificationService.php`)
   - Core service for creating and managing notifications
   - Handles all notification types and business logic

2. **EnhancedNotificationController** (`src/Controllers/EnhancedNotificationController.php`)
   - RESTful API endpoints for notification management
   - Authentication and authorization controls

3. **Database Schema** (`database/enhanced_schema.sql`)
   - `notifications` table with priority and type support
   - Foreign key relationships with lands and users

4. **Cron Job Script** (`cron_notifications.php`)
   - Automated daily checks for harvest due dates
   - Weather alert integration (extensible)
   - Cleanup of old notifications

### Frontend Components

1. **NotificationCenter** (`src/components/core/NotificationCenter.tsx`)
   - Advanced notification display with filtering
   - Priority-based visual indicators
   - Statistics and management controls

2. **Dashboard Integration** (`src/components/dashboard/Dashboard.tsx`)
   - Integrated notification tab
   - Unread count display

## 🚀 How to Send Notifications

### 1. **Direct API Calls**

#### Create Harvest Notifications
```bash
POST /api/notifications/create-harvest
Authorization: Bearer <token>
```

#### Create Maintenance Notification
```bash
POST /api/notifications/create-maintenance
Content-Type: application/json
Authorization: Bearer <token>

{
  "land_id": 1,
  "maintenance_type": "Fertilizer Application",
  "due_date": "2025-10-15"
}
```

#### Create Comment Notification
```bash
POST /api/notifications/create-comment
Content-Type: application/json
Authorization: Bearer <token>

{
  "land_id": 1,
  "comment_text": "Applied fertilizer today"
}
```

#### Create Photo Notification
```bash
POST /api/notifications/create-photo
Content-Type: application/json
Authorization: Bearer <token>

{
  "land_id": 1
}
```

#### Create Weather Alert
```bash
POST /api/notifications/create-weather-alert
Content-Type: application/json
Authorization: Bearer <token>

{
  "land_id": 1,
  "alert_type": "Heavy Rain",
  "severity": "high"
}
```

#### Create System Notification (All Users)
```bash
POST /api/notifications/create-system
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday 2AM-4AM",
  "type": "system"
}
```

### 2. **Programmatic Creation (PHP)**

```php
use App\NotificationService;

$notificationService = new NotificationService();

// Create harvest notification
$notificationService->createHarvestNotifications();

// Create maintenance notification
$notificationService->createMaintenanceNotification(
    $landId, 
    $userId, 
    'Fertilizer Application', 
    '2025-10-15'
);

// Create comment notification
$notificationService->createCommentNotification(
    $landId, 
    $userId, 
    'John Doe', 
    'Applied fertilizer today'
);

// Create system notification for all users
$notificationService->createSystemNotification(
    'System Update', 
    'New features available!'
);
```

### 3. **Automatic Notifications**

#### Cron Job Setup
```bash
# Add to crontab (run daily at 9 AM)
0 9 * * * /usr/bin/php /path/to/your/project/backend/cron_notifications.php
```

#### Manual Cron Execution
```bash
cd backend
php cron_notifications.php
```

## 📊 Notification Types

| Type | Description | Priority | Auto-Generated |
|------|-------------|----------|----------------|
| `harvest_due` | Harvest due soon (≤7 days) | Medium | ✅ |
| `harvest_overdue` | Harvest overdue | High | ✅ |
| `maintenance_due` | Maintenance required | Medium | ❌ |
| `comment_added` | New comment on land | Low | ❌ |
| `photo_added` | New photo uploaded | Low | ❌ |
| `weather_alert` | Weather warning | High/Medium | ❌ |
| `system` | System-wide announcements | Medium | ❌ |
| `bulk` | Bulk notifications | Medium | ❌ |

## 🎨 Frontend Features

### NotificationCenter Component

- **Filtering**: By type and priority
- **Statistics**: Count by notification type
- **Actions**: Mark as read, dismiss, dismiss all
- **Visual Indicators**: Priority colors, unread badges
- **Real-time Updates**: Refresh functionality

### Visual Priority Indicators

- 🔴 **High Priority**: Red border, red background
- 🟡 **Medium Priority**: Yellow border, yellow background  
- 🟢 **Low Priority**: Green border, green background

## 🔧 Setup Instructions

### 1. **Update Database Schema**
```bash
cd backend
php add_notification_priority.php
```

### 2. **Regenerate Autoloader**
```bash
composer dump-autoload
```

### 3. **Update API Routes** (in `api/index.php`)
```php
// Add these routes
$router->get('/notifications', 'EnhancedNotificationController@index');
$router->post('/notifications/create-harvest', 'EnhancedNotificationController@createHarvestNotifications');
$router->post('/notifications/create-maintenance', 'EnhancedNotificationController@createMaintenanceNotification');
$router->post('/notifications/create-comment', 'EnhancedNotificationController@createCommentNotification');
$router->post('/notifications/create-photo', 'EnhancedNotificationController@createPhotoNotification');
$router->post('/notifications/create-weather-alert', 'EnhancedNotificationController@createWeatherAlert');
$router->post('/notifications/create-system', 'EnhancedNotificationController@createSystemNotification');
$router->get('/notifications/stats', 'EnhancedNotificationController@getStats');
$router->post('/notifications/cleanup', 'EnhancedNotificationController@cleanup');
```

### 4. **Test the System**
```bash
# Start backend
cd backend
php -S localhost:8000 -t api/

# Start frontend
cd geocoding
npm run dev
```

## 🌟 Advanced Features

### Weather Integration Example

```php
// In cron_notifications.php
function checkWeatherConditions() {
    $apiKey = 'your_openweathermap_api_key';
    $lat = '14.095840581';
    $lon = '99.820381926';
    
    $url = "http://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lon}&appid={$apiKey}";
    $response = file_get_contents($url);
    $weather = json_decode($response, true);
    
    if ($weather && isset($weather['weather'][0]['main'])) {
        $condition = $weather['weather'][0]['main'];
        $severity = in_array($condition, ['Thunderstorm', 'Tornado']) ? 'high' : 'medium';
        
        $notificationService = new NotificationService();
        $notificationService->createWeatherAlert(null, null, $condition, $severity);
    }
}
```

### Custom Notification Types

To add new notification types:

1. **Update Database Schema**:
```sql
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
    'harvest_due', 
    'harvest_overdue', 
    'maintenance_due', 
    'comment_added', 
    'photo_added',
    'weather_alert',
    'system',
    'bulk',
    'your_new_type'  -- Add here
) NOT NULL;
```

2. **Add Method to NotificationService**:
```php
public function createYourNewType($landId, $userId, $data) {
    $title = "Your Custom Title";
    $message = "Your custom message: {$data}";
    
    return $this->createNotification($landId, $userId, 'your_new_type', $title, $message, 'medium');
}
```

3. **Add Controller Method**:
```php
public function createYourNewType() {
    $user = Auth::requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $notificationId = $this->notificationService->createYourNewType(
        $input['land_id'],
        $user['user_id'],
        $input['data']
    );
    
    echo json_encode([
        'success' => true,
        'message' => 'Your new type notification created',
        'notification_id' => $notificationId
    ]);
}
```

## 📈 Monitoring and Analytics

### Notification Statistics
```bash
GET /api/notifications/stats
```

Returns:
```json
{
  "success": true,
  "data": [
    {
      "type": "harvest_due",
      "count": 15,
      "unread_count": 3,
      "active_count": 12
    }
  ]
}
```

### Cleanup Old Notifications
```bash
POST /api/notifications/cleanup?days=30
```

## 🔒 Security & Permissions

- **Authentication Required**: All endpoints require valid JWT token
- **Role-based Access**: 
  - Admin: Can create system notifications, weather alerts
  - Contributor: Can create harvest notifications
  - User: Can view and manage their own notifications
- **Data Validation**: All inputs validated and sanitized
- **SQL Injection Protection**: Prepared statements used throughout

## 🚨 Troubleshooting

### Common Issues

1. **Notifications not appearing**:
   - Check authentication token
   - Verify database connection
   - Check notification type in database

2. **Cron job not running**:
   - Verify PHP path in crontab
   - Check file permissions
   - Test manual execution

3. **Frontend not loading**:
   - Check API endpoints
   - Verify CORS settings
   - Check browser console for errors

### Debug Commands

```bash
# Test notification creation
curl -X POST http://localhost:8000/api/notifications/create-harvest \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check notification stats
curl -X GET http://localhost:8000/api/notifications/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test cron job manually
cd backend && php cron_notifications.php
```

## 🎯 Best Practices

1. **Use Appropriate Priorities**: High for urgent, Medium for important, Low for informational
2. **Include Context**: Always include land information in notifications
3. **Clean Up Regularly**: Run cleanup to remove old dismissed notifications
4. **Monitor Performance**: Check notification counts and database size
5. **Test Thoroughly**: Verify notifications appear correctly in frontend

## 🔮 Future Enhancements

- **Email Notifications**: Integrate with email service
- **Push Notifications**: Browser push notifications
- **Mobile App**: Native mobile notification support
- **WebSocket**: Real-time notification delivery
- **AI Integration**: Smart notification timing and content

---

This notification system provides a robust foundation for user communication without SMS, with room for future enhancements and integrations! 🚀
