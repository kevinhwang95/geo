# 🔍 InfoWindow Debug Guide

## 🎯 **Issue**: Map centering works but InfoWindow not displaying

Since the map centering is working, the issue is specifically with the InfoWindow logic. I've added comprehensive debugging to identify the exact problem.

## 🚀 **New Debugging Features**

### **1. Enhanced InfoWindow Debugging**
- **Marker Finding**: Detailed logs for marker search and matching
- **InfoWindow Initialization**: Ensures InfoWindow is properly created
- **Content Setting**: Logs content length and setting process
- **Opening Process**: Tracks InfoWindow opening with error handling
- **Verification**: Checks if InfoWindow actually opens after 100ms

### **2. Test Buttons**
- **Test Map Store**: Tests map centering functionality
- **Test InfoWindow**: Specifically tests InfoWindow with delay

### **3. Fallback Mechanism**
- **No Marker Found**: Creates InfoWindow at center point
- **Error Handling**: Graceful handling of InfoWindow errors
- **Verification**: Checks if fallback InfoWindow opens

## 🧪 **How to Debug**

### **Step 1: Test InfoWindow Specifically**
1. **Open**: `http://localhost:5173` in your browser
2. **Login** and go to **Dashboard**
3. **Click**: "Test InfoWindow" button (new button in header)
4. **Check Console**: Should see detailed InfoWindow debugging

### **Step 2: Test Land Card Click**
1. **Click**: "Lands" tab
2. **Click**: Any land card or "View Details" button
3. **Check Console**: Should see complete InfoWindow flow

## 🔍 **Expected Console Output**

### **InfoWindow Test**:
```
Testing InfoWindow specifically...
Testing InfoWindow with land: Test5654
Map store: centerMapOnLand called with land: Test5654
Map store: state updated, shouldCenterMap set to true
Map centering useEffect triggered: {
  selectedLand: "Test5654",
  shouldCenterMap: true,
  mapInstance: true,
  drawRef: true,
  markersCount: 8,
  terraDrawInitialized: true
}
Starting map centering for land: Test5654
Map centered and zoomed
Looking for marker with title: Land Code: U7
Available markers: ["Land Code: U7", "Land Code: G68", ...]
Land code from selected land: U7
Found marker: true
Marker details: {
  title: "Land Code: U7",
  position: "(14.0959, 99.8206)",
  map: "[object Object]"
}
Initializing InfoWindow...
InfoWindow initialized successfully
InfoWindow ready: true
InfoWindow details: {
  isOpen: false,
  content: "..."
}
Setting InfoWindow content and opening...
InfoWindow content length: 1234
Opening InfoWindow with marker: Land Code: U7
InfoWindow content set successfully
InfoWindow opened successfully
InfoWindow verification - is open: true
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Marker Not Found**
**Symptoms**: `Found marker: false` in logs
**Causes**:
- Land code mismatch between data and marker title
- Markers not created yet
- Title format inconsistency

**Solution**: Check marker creation and title format

### **Issue 2: InfoWindow Not Initialized**
**Symptoms**: `InfoWindow ready: false` in logs
**Causes**:
- Google Maps API not loaded
- Map instance not ready
- Timing issue

**Solution**: Check map initialization and API loading

### **Issue 3: InfoWindow Content Error**
**Symptoms**: Error in `setContent` or `open` methods
**Causes**:
- Invalid HTML content
- Google Maps API issue
- Content too large

**Solution**: Check content format and size

### **Issue 4: InfoWindow Opens But Not Visible**
**Symptoms**: `InfoWindow verification - is open: true` but not visible
**Causes**:
- Z-index issues
- Map bounds issue
- CSS conflicts

**Solution**: Check map styling and InfoWindow positioning

## 🔧 **Debugging Checklist**

### **Marker Finding**:
- [ ] Land code matches marker title format
- [ ] Markers are created and available
- [ ] Marker has valid position and map reference

### **InfoWindow Initialization**:
- [ ] InfoWindow is created successfully
- [ ] InfoWindow reference is valid
- [ ] Google Maps API is loaded

### **InfoWindow Content**:
- [ ] Content is set successfully
- [ ] Content length is reasonable
- [ ] HTML is valid

### **InfoWindow Opening**:
- [ ] InfoWindow opens without errors
- [ ] InfoWindow is attached to map
- [ ] InfoWindow is visible on screen

## 🎯 **What to Look For**

### **Success Indicators**:
- ✅ All debug logs appear in sequence
- ✅ No error messages
- ✅ InfoWindow verification shows `is open: true`
- ✅ InfoWindow is visible on map

### **Failure Points**:
- ❌ Missing logs indicate where process stops
- ❌ Error messages show specific issues
- ❌ `false` values in condition checks
- ❌ InfoWindow verification shows `is open: false`

## 🚀 **Enhanced Features**

### **1. InfoWindow Initialization Check**:
- Ensures InfoWindow is created before use
- Handles timing issues
- Provides fallback creation

### **2. Detailed Marker Debugging**:
- Shows marker title, position, and map reference
- Helps identify title matching issues
- Verifies marker validity

### **3. Content and Opening Verification**:
- Logs content length and setting process
- Tracks opening process with error handling
- Verifies InfoWindow actually opens

### **4. Fallback InfoWindow**:
- Creates InfoWindow at center point if marker not found
- Provides alternative display method
- Includes verification for fallback

The enhanced debugging will help identify exactly why the InfoWindow isn't displaying! 🔍✨
