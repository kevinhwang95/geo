# 🔧 Map Store Function Conflict Fix

## 🐛 **Issue**: `centerMapOnLand is not a function`

The error occurred because there was a naming conflict in the map store between a state property and an action function.

## 🔍 **Root Cause**

In the `mapStore.ts`, there were two things with the same name:

```typescript
interface MapState {
  centerMapOnLand: boolean;  // ❌ State property
}

interface MapActions {
  centerMapOnLand: (land: Land) => void;  // ❌ Action function
}
```

This caused JavaScript to overwrite the function with the boolean value, making `centerMapOnLand` not callable.

## ✅ **Solution**

Renamed the state property to avoid the conflict:

```typescript
interface MapState {
  shouldCenterMap: boolean;  // ✅ Renamed state property
}

interface MapActions {
  centerMapOnLand: (land: Land) => void;  // ✅ Action function (unchanged)
}
```

## 🔧 **Changes Made**

1. **Map Store** (`src/stores/mapStore.ts`):
   - Renamed `centerMapOnLand: boolean` → `shouldCenterMap: boolean`
   - Updated all references in the store implementation

2. **TerraDrawingTools** (`src/components/core/TerraDrawingTools.tsx`):
   - Updated destructuring: `centerMapOnLand` → `shouldCenterMap`
   - Updated useEffect condition: `centerMapOnLand` → `shouldCenterMap`
   - Updated useEffect dependency array

## 🎯 **Result**

- ✅ **Function Works**: `centerMapOnLand()` is now properly callable
- ✅ **No Conflicts**: State and actions have distinct names
- ✅ **Map Centering**: Clicking land cards now works correctly
- ✅ **Type Safety**: TypeScript types are consistent

The map centering feature should now work properly when clicking on land cards in the Lands tab! 🗺️✨
