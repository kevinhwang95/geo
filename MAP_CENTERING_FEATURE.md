# 🗺️ Map Centering & InfoWindow Feature Guide

## 🎯 **Overview**

I've successfully implemented a feature that allows users to click on land cards in the Lands tab and automatically center the map on that land while displaying its InfoWindow. This creates a seamless connection between the Lands tab and Map tab.

## ✅ **Features Implemented**

### **1. 🏪 Shared State Management**
- **File**: `src/stores/mapStore.ts`
- **Purpose**: Manages land selection and map centering state across components
- **Features**:
  - `selectedLand`: Currently selected land
  - `centerMapOnLand`: Flag to trigger map centering
  - `showInfoWindow`: Flag to show InfoWindow
  - Actions: `selectLand()`, `centerMapOnLand()`, `clearSelection()`

### **2. 🎯 Land Card Click Handler**
- **File**: `src/components/dashboard/Dashboard.tsx`
- **Function**: `handleViewLandDetails(landId: number)`
- **Behavior**:
  - Finds the land by ID from the lands array
  - Switches to Map tab automatically
  - Calls `centerMapOnLand(land)` to trigger centering
  - Logs the action for debugging

### **3. 🗺️ Map Centering Logic**
- **File**: `src/components/core/TerraDrawingTools.tsx`
- **Function**: `useEffect` hook for map centering
- **Features**:
  - Parses land geometry to get coordinates
  - Calculates center point of the polygon
  - Centers map and zooms to level 16
  - Finds corresponding marker
  - Shows InfoWindow with land details

### **4. 📋 Enhanced InfoWindow**
- **Design**: Two-column grid layout with color-coded sections
- **Information Displayed**:
  - Land Name & Code
  - Size & Plant Type
  - Category & Harvest Status
  - Location (City, Province)
  - Next Harvest Date
- **Styling**: Professional color scheme with proper spacing

## 🔧 **Technical Implementation**

### **State Management Flow**:
```typescript
// 1. User clicks land card in Dashboard
handleViewLandDetails(landId) → 
  setActiveTab('map') → 
  centerMapOnLand(land)

// 2. TerraDrawingTools detects state change
useEffect([selectedLand, centerMapOnLand]) → 
  calculateCenter() → 
  setCenter() → 
  showInfoWindow() → 
  clearSelection()
```

### **Map Centering Algorithm**:
```typescript
// Parse polygon coordinates
const geojson = JSON.parse(selectedLand.coordinations);
const coordinates = geojson.geometry.coordinates[0];

// Calculate center point
let centerLat = 0, centerLng = 0;
coordinates.forEach(coord => {
  centerLng += coord[0];
  centerLat += coord[1];
});
centerLat /= coordinates.length;
centerLng /= coordinates.length;

// Center map
mapInstanceRef.current.setCenter({ lat: centerLat, lng: centerLng });
mapInstanceRef.current.setZoom(16);
```

### **InfoWindow Content Generation**:
```typescript
const infoContent = `
  <div style="font-family: Arial, sans-serif; max-width: 300px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <!-- Color-coded information sections -->
    </div>
  </div>
`;
```

## 🎮 **How to Use**

### **Step-by-Step Process**:
1. **Navigate**: Go to Dashboard → Lands tab
2. **Browse**: Scroll through land cards
3. **Click**: Click on any land card or "View Details" button
4. **Automatic**: 
   - Switches to Map tab
   - Centers map on the selected land
   - Zooms in to show land clearly
   - Displays InfoWindow with land details

### **Visual Feedback**:
- **Map Movement**: Smooth transition to land location
- **Zoom Level**: Automatically zooms to level 16 for clear view
- **InfoWindow**: Professional popup with all land information
- **Marker Highlight**: Corresponding marker is found and InfoWindow attached

## 🎨 **UI/UX Features**

### **InfoWindow Design**:
- **Grid Layout**: Two-column responsive grid
- **Color Coding**: Each section has distinct background colors
- **Typography**: Clear hierarchy with bold labels and readable content
- **Spacing**: Proper padding and margins for readability
- **Responsive**: Adapts to different screen sizes

### **Color Scheme**:
- **Land Name**: Light gray (`#f8f9fa`)
- **Land Code**: Light blue (`#e3f2fd`)
- **Size**: Light purple (`#f3e5f5`)
- **Plant Type**: Light green (`#e8f5e8`)
- **Category**: Light orange (`#fff3e0`)
- **Harvest Status**: Light pink (`#fce4ec`)

## 🚀 **Benefits**

### **User Experience**:
- ✅ **Seamless Navigation**: No manual map searching required
- ✅ **Instant Information**: All land details in one popup
- ✅ **Visual Context**: See land location and boundaries
- ✅ **Efficient Workflow**: Quick access from land list to map view

### **Technical Benefits**:
- ✅ **State Management**: Centralized land selection state
- ✅ **Reusable**: Can be extended for other map interactions
- ✅ **Type Safe**: Proper TypeScript interfaces
- ✅ **Error Handling**: Graceful fallbacks for missing data

## 🧪 **Testing**

### **Test Scenarios**:
1. **Basic Functionality**:
   - Click land card → Should switch to map tab
   - Map should center on the land
   - InfoWindow should appear

2. **Data Display**:
   - All land information should be visible
   - Colors should be properly applied
   - Layout should be responsive

3. **Error Handling**:
   - Invalid geometry → Should log error gracefully
   - Missing marker → Should handle gracefully
   - No land data → Should not crash

### **How to Test**:
1. **Open**: `http://localhost:5173` in your browser
2. **Login** and go to **Dashboard**
3. **Click**: "Lands" tab
4. **Click**: Any land card or "View Details" button
5. **Observe**: 
   - Tab switches to "Map"
   - Map centers on the land
   - InfoWindow appears with land details

## 🔧 **Configuration**

### **Customizable Settings**:
- **Zoom Level**: Currently set to 16 (can be adjusted)
- **InfoWindow Width**: Currently 300px (can be modified)
- **Color Scheme**: Can be updated in the CSS
- **Information Fields**: Can add/remove fields as needed

### **Future Enhancements**:
- **Animation**: Smooth map transition animations
- **Multiple Selection**: Select multiple lands at once
- **Land Highlighting**: Highlight selected land polygon
- **Custom InfoWindow**: More interactive InfoWindow content

## 🎉 **Result**

The map centering and InfoWindow feature is now fully functional:

- ✅ **Land Card Clicks**: Automatically center map and show InfoWindow
- ✅ **Seamless Navigation**: Smooth transition between Lands and Map tabs
- ✅ **Rich Information**: Comprehensive land details in InfoWindow
- ✅ **Professional Design**: Clean, color-coded information display
- ✅ **Error Handling**: Graceful handling of edge cases
- ✅ **Type Safety**: Proper TypeScript implementation

Users can now easily navigate from the land list to the map view with a single click, making the application much more user-friendly and efficient! 🗺️✨
