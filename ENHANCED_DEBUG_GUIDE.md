# 🔍 Enhanced Debugging Guide for Map Centering

## 🚀 **New Debugging Features Added**

I've added comprehensive debugging and a test button to help identify the issue with map centering and InfoWindow display.

## 🧪 **How to Debug Step by Step**

### **Step 1: Test Map Store Function**
1. **Open**: `http://localhost:5173` in your browser
2. **Login** and go to **Dashboard**
3. **Click**: "Test Map Store" button (new button in header)
4. **Check Console**: Should see map store debugging logs

### **Step 2: Test Land Card Click**
1. **Click**: "Lands" tab
2. **Click**: Any land card or "View Details" button
3. **Check Console**: Should see complete debugging flow

### **Step 3: Check Console Output**

#### **Expected Map Store Logs**:
```
Testing map store...
Testing with land: Test5654
Map store: centerMapOnLand called with land: Test5654
Map store: state updated, shouldCenterMap set to true
```

#### **Expected TerraDrawingTools Logs**:
```
Map centering useEffect triggered: {
  selectedLand: "Test5654",
  shouldCenterMap: true,
  mapInstance: true,
  drawRef: true,
  markersCount: 8,
  terraDrawInitialized: true
}
Starting map centering for land: Test5654
Parsed GeoJSON: {type: "Feature", geometry: {...}}
Using Feature geometry coordinates
Coordinates found: 5 points
Calculated center: {lat: 14.0959, lng: 99.8206}
Map centered and zoomed
Looking for marker with title: Land Code: U7
Available markers: ["Land Code: U7", "Land Code: G68", ...]
Found marker: true
InfoWindow ref: true
Setting InfoWindow content and opening...
InfoWindow opened successfully
Cleared selection after centering
```

## 🔍 **Debugging Checklist**

### **Map Store Test**:
- [ ] "Test Map Store" button appears in header
- [ ] Clicking button shows map store logs
- [ ] `centerMapOnLand` function is called
- [ ] State is updated correctly

### **Land Card Click Test**:
- [ ] Click handler is triggered
- [ ] Land is found by ID
- [ ] Tab switches to 'map'
- [ ] Map store function is called

### **TerraDrawingTools Test**:
- [ ] useEffect is triggered
- [ ] All conditions are met (`terraDrawInitialized: true`)
- [ ] GeoJSON parses correctly
- [ ] Coordinates are extracted
- [ ] Map centers and zooms
- [ ] Marker is found
- [ ] InfoWindow opens

## 🐛 **Common Issues & Solutions**

### **Issue 1: Map Store Not Working**
**Symptoms**: No map store logs appear
**Solution**: Check if Zustand store is properly imported and initialized

### **Issue 2: TerraDraw Not Initialized**
**Symptoms**: `terraDrawInitialized: false` in logs
**Solution**: Wait for map to fully load, or check TerraDraw initialization

### **Issue 3: No Markers Available**
**Symptoms**: `markersCount: 0` in logs
**Solution**: Check if `createPolygonMarkers` is being called

### **Issue 4: Marker Not Found**
**Symptoms**: `Found marker: false` in logs
**Solution**: Check marker title format and land code

### **Issue 5: InfoWindow Not Opening**
**Symptoms**: All other logs appear but no InfoWindow
**Solution**: Check InfoWindow initialization and Google Maps API

## 🎯 **What to Look For**

### **Success Indicators**:
- ✅ All debug logs appear in sequence
- ✅ No error messages
- ✅ Map visibly centers and zooms
- ✅ InfoWindow appears with content

### **Failure Points**:
- ❌ Missing logs indicate where process stops
- ❌ Error messages show specific issues
- ❌ `false` values in condition checks
- ❌ Map doesn't move or zoom

## 🔧 **Enhanced Features**

### **1. Map Store Debugging**:
- Logs when `centerMapOnLand` is called
- Shows state updates
- Tracks `clearSelection` calls

### **2. TerraDraw Initialization Check**:
- Ensures TerraDraw is ready before centering
- Prevents timing issues
- Added to dependency array

### **3. Delayed Clear Selection**:
- Prevents immediate clearing of centering flag
- Allows centering logic to complete
- 100ms delay for proper execution

### **4. Test Button**:
- Quick way to test map store functionality
- Bypasses land card click logic
- Direct function call testing

## 📊 **Debugging Output Analysis**

### **If Test Button Works But Land Cards Don't**:
- Issue is in Dashboard component
- Check click handlers and land finding logic

### **If Neither Works**:
- Issue is in map store or TerraDrawingTools
- Check state management and useEffect logic

### **If Map Centers But No InfoWindow**:
- Issue is in marker finding or InfoWindow logic
- Check marker creation and InfoWindow initialization

The enhanced debugging will help pinpoint exactly where the issue occurs! 🔍✨
