# 🔍 Map Centering & InfoWindow Debug Guide

## 🐛 **Issue**: Map not centering and InfoWindow not displaying

I've added comprehensive debugging to help identify why the map centering and InfoWindow features aren't working.

## 🔧 **Debugging Added**

### **1. Dashboard Component Debugging**
- **Function Call Tracking**: Logs when `handleViewLandDetails` is called
- **Land Data Verification**: Shows available lands and found land
- **Function Execution**: Confirms `centerMapOnLand` function is called

### **2. TerraDrawingTools Component Debugging**
- **useEffect Trigger**: Logs when the centering useEffect runs
- **Condition Checks**: Shows which conditions are met/not met
- **GeoJSON Parsing**: Logs parsed geometry data
- **Coordinate Extraction**: Shows coordinate calculation process
- **Map Operations**: Confirms map centering and zoom
- **Marker Search**: Shows available markers and search results
- **InfoWindow Operations**: Logs InfoWindow creation and opening

### **3. Fallback Mechanism**
- **No Marker Found**: Creates InfoWindow at center point if marker not found
- **Error Handling**: Graceful handling of parsing errors
- **Condition Logging**: Shows why conditions aren't met

## 🧪 **How to Debug**

### **Step 1: Test the Feature**
1. **Open**: `http://localhost:5173` in your browser
2. **Login** and go to **Dashboard**
3. **Click**: "Lands" tab
4. **Click**: Any land card or "View Details" button
5. **Open Browser Console** (F12 → Console tab)

### **Step 2: Check Console Output**

#### **Expected Dashboard Logs**:
```
handleViewLandDetails called with landId: 10
Available lands: [{id: 10, name: "Test Field Updated"}, ...]
Found land: {id: 10, land_name: "Test Field Updated", ...}
Switching to map tab and centering on land: Test Field Updated
centerMapOnLand function called
```

#### **Expected TerraDrawingTools Logs**:
```
Map centering useEffect triggered: {
  selectedLand: "Test Field Updated",
  shouldCenterMap: true,
  mapInstance: true,
  drawRef: true,
  markersCount: 8
}
Starting map centering for land: Test Field Updated
Parsed GeoJSON: {type: "Polygon", coordinates: [...]}
Using raw Polygon coordinates
Coordinates found: 5 points
Calculated center: {lat: 13.5, lng: 100.5}
Map centered and zoomed
Looking for marker with title: Land Code: TF002
Available markers: ["Land Code: U7", "Land Code: G68", ...]
Found marker: true/false
InfoWindow ref: true
Setting InfoWindow content and opening...
InfoWindow opened successfully
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: Function Not Called**
**Symptoms**: No Dashboard logs appear
**Causes**: 
- Click handler not attached
- Land not found
- Type mismatch

**Solution**: Check if land ID matches and click handler is properly attached

### **Issue 2: useEffect Not Triggered**
**Symptoms**: Dashboard logs appear but no TerraDrawingTools logs
**Causes**:
- Map store not updating
- Component not mounted
- State not propagating

**Solution**: Check map store state and component mounting

### **Issue 3: Map Instance Not Available**
**Symptoms**: `mapInstance: false` in logs
**Causes**:
- Map not initialized
- Component timing issue
- Google Maps API not loaded

**Solution**: Ensure map is fully loaded before centering

### **Issue 4: No Markers Found**
**Symptoms**: `markersCount: 0` or `Found marker: false`
**Causes**:
- Markers not created
- Title mismatch
- Timing issue

**Solution**: Check marker creation and title format

### **Issue 5: InfoWindow Not Opening**
**Symptoms**: All other logs appear but no InfoWindow
**Causes**:
- InfoWindow ref not initialized
- Google Maps API issue
- Content formatting error

**Solution**: Check InfoWindow initialization and content

## 🎯 **Debugging Checklist**

### **Dashboard Component**:
- [ ] `handleViewLandDetails` is called
- [ ] Land is found by ID
- [ ] `centerMapOnLand` function exists and is called
- [ ] Tab switches to 'map'

### **Map Store**:
- [ ] `selectedLand` is set
- [ ] `shouldCenterMap` is true
- [ ] State updates properly

### **TerraDrawingTools**:
- [ ] useEffect triggers
- [ ] All conditions are met
- [ ] GeoJSON parses correctly
- [ ] Coordinates are extracted
- [ ] Map centers and zooms
- [ ] Marker is found (or fallback works)
- [ ] InfoWindow opens

## 🚀 **Expected Behavior**

When working correctly, clicking a land card should:

1. **Switch to Map tab** automatically
2. **Center the map** on the land's location
3. **Zoom in** to level 16
4. **Show InfoWindow** with land details
5. **Display comprehensive** land information

## 📊 **Console Output Analysis**

### **Success Indicators**:
- ✅ All debug logs appear in sequence
- ✅ No error messages
- ✅ Map visibly centers and zooms
- ✅ InfoWindow appears with content

### **Failure Indicators**:
- ❌ Missing logs indicate where the process stops
- ❌ Error messages show specific issues
- ❌ Map doesn't move or zoom
- ❌ No InfoWindow appears

The comprehensive debugging will help identify exactly where the process is failing! 🔍✨
