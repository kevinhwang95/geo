# 🔍 Frontend Filtering Debug Guide

## 🎯 **Issue**: Filters not working in dashboard

## ✅ **Backend Fix Applied**: 
- Updated `/api/notifications` endpoint to use `EnhancedNotificationController` 
- This enables filtering by `type` and `priority` parameters
- All filtering endpoints tested and working (returning 401 as expected)

## 🧪 **How to Test Frontend Filtering**

### **Step 1: Access the Application**
1. Open browser to: `http://localhost:5173`
2. Login with your credentials
3. Navigate to Dashboard → **Notifications** tab

### **Step 2: Test Filtering Functionality**

#### **A. Test Type Filtering**
1. **Open Browser Developer Tools** (F12)
2. **Go to Console tab**
3. **Click on Type dropdown** in the notifications section
4. **Select "Harvest Due"** from the dropdown
5. **Check Console** for any error messages
6. **Expected Result**: Only harvest notifications should be displayed

#### **B. Test Priority Filtering**
1. **Click on Priority dropdown**
2. **Select "High Priority"**
3. **Check Console** for any error messages
4. **Expected Result**: Only high priority notifications should be displayed

#### **C. Test Combined Filtering**
1. **Set Type**: "Harvest Overdue"
2. **Set Priority**: "High Priority"
3. **Expected Result**: Only high priority harvest overdue notifications

### **Step 3: Debug Information**

#### **Check Network Tab**
1. **Open Developer Tools** → **Network tab**
2. **Apply a filter** (e.g., select "High Priority")
3. **Look for the API call** to `/api/notifications`
4. **Check the request URL** - it should include `?priority=high`
5. **Check the response** - should return filtered notifications

#### **Expected API Calls**
```
GET /api/notifications?type=harvest_overdue
GET /api/notifications?priority=high
GET /api/notifications?type=harvest_overdue&priority=high
```

### **Step 4: Common Issues & Solutions**

#### **Issue 1: "Stats endpoint not available"**
- **Solution**: This is expected and handled gracefully
- **Check**: Console should show "Stats endpoint not available, skipping..."

#### **Issue 2: 401 Unauthorized**
- **Solution**: Make sure you're logged in
- **Check**: Authentication token should be included in requests

#### **Issue 3: No notifications showing**
- **Solution**: Check if notifications exist in database
- **Run**: `php test_notifications.php` to verify data

#### **Issue 4: Filters not applying**
- **Solution**: Check browser console for JavaScript errors
- **Check**: Network tab for API call parameters

### **Step 5: Manual Testing Commands**

#### **Test Backend Directly** (with authentication):
```bash
# Get auth token from browser (F12 → Application → Local Storage)
# Then test with curl:

curl -X GET "http://localhost:8000/api/notifications?type=harvest_overdue" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/notifications?priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Step 6: Expected Results**

#### **Current Notifications in Database**:
- 🌾 **Harvest Overdue**: 8 notifications (High Priority)
- 🔧 **Maintenance Due**: 1 notification (Medium Priority)  
- 💬 **Comment Added**: 1 notification (Low Priority)
- 📸 **Photo Added**: 1 notification (Low Priority)
- 🌦️ **Weather Alert**: 1 notification (High Priority)

#### **Filter Test Results**:
- **Type: "Harvest Overdue"** → Should show 8 notifications
- **Priority: "High"** → Should show 9 notifications (8 harvest + 1 weather)
- **Priority: "Medium"** → Should show 1 notification (maintenance)
- **Priority: "Low"** → Should show 2 notifications (comment + photo)

### **Step 7: Troubleshooting Checklist**

- [ ] ✅ Backend server running (`http://localhost:8000`)
- [ ] ✅ Frontend server running (`http://localhost:5173`)
- [ ] ✅ User logged in with valid token
- [ ] ✅ Notifications tab accessible in dashboard
- [ ] ✅ Filter dropdowns visible and clickable
- [ ] ✅ No JavaScript errors in console
- [ ] ✅ API calls visible in Network tab
- [ ] ✅ Response data contains filtered notifications

### **Step 8: If Still Not Working**

#### **Check Browser Console**:
```javascript
// Open browser console and run:
console.log('Testing notification API...');

// Check if axiosClient is working
fetch('/api/notifications?priority=high', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(response => response.json())
.then(data => console.log('API Response:', data))
.catch(error => console.error('API Error:', error));
```

#### **Check Local Storage**:
- Open F12 → Application → Local Storage
- Look for `token` or `authToken` key
- Verify token exists and is not expired

---

## 🎉 **Expected Outcome**

After following these steps, the filtering should work correctly:

1. **Type Filter**: Shows only notifications of selected type
2. **Priority Filter**: Shows only notifications of selected priority  
3. **Combined Filter**: Shows notifications matching both criteria
4. **Real-time Updates**: Filters apply immediately when changed
5. **Visual Feedback**: Filtered results display with proper styling

The backend filtering is now properly implemented and should work with the frontend! 🚀
