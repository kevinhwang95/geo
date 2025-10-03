# 🔍 Notifications Frontend Debug Guide

## 🎯 **Issue**: Notifications not showing in dashboard

## ✅ **Backend Status**: 
- ✅ Database has 10 notifications (2 for user 1)
- ✅ Basic `/api/notifications` endpoint working (returns 401)
- ✅ Enhanced `/api/notifications-enhanced` endpoint working (returns 401)
- ✅ Both endpoints require authentication

## 🧪 **Step-by-Step Debugging**

### **Step 1: Check Authentication**
1. **Open Browser** → `http://localhost:5173`
2. **Login** with your credentials
3. **Open Developer Tools** (F12)
4. **Go to Application tab** → **Local Storage**
5. **Look for authentication token**:
   - Look for keys like `token`, `authToken`, `access_token`
   - **Expected**: Should see a JWT token value

### **Step 2: Test API Call Manually**
1. **Open Console tab** in Developer Tools
2. **Run this command**:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token') || localStorage.getItem('authToken'));

// Test API call
fetch('/api/notifications', {
  headers: {
    'Authorization': 'Bearer ' + (localStorage.getItem('token') || localStorage.getItem('authToken'))
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('API Response:', data);
})
.catch(error => {
  console.error('API Error:', error);
});
```

### **Step 3: Check Network Tab**
1. **Go to Network tab** in Developer Tools
2. **Navigate to Dashboard** → **Notifications tab**
3. **Look for API calls**:
   - Should see call to `/api/notifications`
   - **Check Status**: Should be 200 (not 401)
   - **Check Response**: Should contain notification data

### **Step 4: Expected Results**

#### **If Authentication is Working**:
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "type": "harvest_overdue",
      "title": "Harvest Overdue",
      "message": "Harvest for Test Field Updated is overdue by X days",
      "priority": "medium",
      "is_read": false,
      "land_name": "Test Field Updated",
      "land_code": "TF002"
    },
    {
      "id": 2,
      "type": "maintenance_due", 
      "title": "🔧 Maintenance Required",
      "message": "Maintenance for Fertilizer Application is due on Oct 15, 2025",
      "priority": "medium",
      "is_read": false,
      "land_name": "Test",
      "land_code": "Test"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

#### **If Authentication is NOT Working**:
```json
{
  "error": "Unauthorized"
}
```

### **Step 5: Common Issues & Solutions**

#### **Issue 1: No Token Found**
- **Problem**: `localStorage.getItem('token')` returns `null`
- **Solution**: 
  1. Make sure you're logged in
  2. Check if token is stored under different key
  3. Try logging out and logging back in

#### **Issue 2: Token Expired**
- **Problem**: API returns 401 even with token
- **Solution**: 
  1. Log out and log back in
  2. Check token expiration in JWT payload

#### **Issue 3: Wrong Token Format**
- **Problem**: Token exists but API still returns 401
- **Solution**: 
  1. Check token format (should start with `eyJ`)
  2. Verify Authorization header format: `Bearer <token>`

#### **Issue 4: CORS Issues**
- **Problem**: Network tab shows CORS errors
- **Solution**: 
  1. Make sure backend server is running on `localhost:8000`
  2. Check CORS headers in backend

### **Step 6: Test Filtering**

Once basic notifications are working:

1. **Apply Type Filter**: Select "Harvest Overdue"
   - **Expected**: Should call `/api/notifications-enhanced?type=harvest_overdue`
   - **Result**: Should show only harvest notifications

2. **Apply Priority Filter**: Select "High Priority"
   - **Expected**: Should call `/api/notifications-enhanced?priority=high`
   - **Result**: Should show only high priority notifications

### **Step 7: Manual Token Test**

If you have a valid token, test it directly:

```bash
# Replace YOUR_TOKEN_HERE with actual token from browser
curl -X GET "http://localhost:8000/api/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Step 8: Expected Notification Count**

Based on database tests, you should see:
- **User 1 (System Administrator)**: 2 notifications
- **User 2 (John Doe)**: 1 notification  
- **User 5 (Dev User)**: 7 notifications

### **Step 9: Troubleshooting Checklist**

- [ ] ✅ Backend server running (`http://localhost:8000`)
- [ ] ✅ Frontend server running (`http://localhost:5173`)
- [ ] ✅ User logged in successfully
- [ ] ✅ Authentication token exists in localStorage
- [ ] ✅ Token is valid (not expired)
- [ ] ✅ API call returns 200 (not 401)
- [ ] ✅ Response contains notification data
- [ ] ✅ Notifications display in UI
- [ ] ✅ Filters work when applied

### **Step 10: If Still Not Working**

#### **Check Browser Console for Errors**:
```javascript
// Run this in browser console
console.log('=== DEBUG INFO ===');
console.log('Token:', localStorage.getItem('token'));
console.log('All localStorage:', localStorage);
console.log('Current URL:', window.location.href);
console.log('User agent:', navigator.userAgent);
```

#### **Check Network Requests**:
1. **Clear Network tab**
2. **Refresh notifications page**
3. **Look for**:
   - `/api/notifications` call
   - Status code (should be 200)
   - Response data (should contain notifications)
   - Request headers (should include Authorization)

---

## 🎉 **Expected Outcome**

After following these steps, you should see:

1. **2 notifications** for the logged-in user
2. **Proper styling** with priority colors
3. **Working filters** that show filtered results
4. **Interactive buttons** (Mark Read, Dismiss)

The notifications should now be visible in the dashboard! 🚀
