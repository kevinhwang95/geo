import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { getTranslatedPlantType, getTranslatedCategory } from '@/utils/translationUtils';
import { formatLandSizeToThaiUnits } from '@/utils/areaCalculator';
import {MyFormDialog} from "@/components/core/my-form-dialog";
import CreateNotificationDialog from "@/components/core/CreateNotificationDialog";
import { Loader } from "@googlemaps/js-api-loader";
import { getMarkerBackgroundColor } from '@/utils/markerColors';
import {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawCircleMode,
  TerraDrawFreehandMode,
} from "terra-draw";
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter";

import { useGenericCrud } from '@/hooks/useGenericCrud';
import type LandRegistry from '@/types/landRegistry.type';
import { useAuthStore, canManageLands } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import NotificationMarkersManager from './NotificationMarkersManager';
import { useDynamicMapHeight } from '@/hooks/useDynamicMapHeight';
//import PolygonDebugger from '@/components/debug/PolygonDebugger';
//import TokenExpirationMonitor from '@/components/debug/TokenExpirationMonitor';

const colorPalette = [
  "#E74C3C", "#FF0066", "#9B59B6", "#673AB7", "#3F51B5", "#3498DB", "#03A9F4",
  "#00BCD4", "#009688", "#27AE60", "#8BC34A", "#CDDC39", "#F1C40F", "#FFC107",
  "#F39C12", "#FF5722", "#795548"
];
const getRandomColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)] as `#${string}`;

function processSnapshotForUndo(snapshot: any[]): any[] {
  return snapshot.map(feature => {
    const newFeature = JSON.parse(JSON.stringify(feature));
    if (newFeature.properties.mode === "rectangle") {
      newFeature.geometry.type = "Polygon";
      newFeature.properties.mode = "polygon";
    } else if (newFeature.properties.mode === "circle") {
      newFeature.geometry.type = "Polygon";
      newFeature.properties.mode = "circle";
    }
    return newFeature;
  });
}

function getCenter(coordinates: number[][][]) {
  let x = 0, y = 0, count = 0;
  coordinates.forEach(ring => {
    ring.forEach(point => {
      x += point[0];
      y += point[1];
      count++;
    });
  });
  return [x / count, y / count];
}

function isPolygonFeature(feature: any): feature is { geometry: { type: "Polygon"; coordinates: number[][][] }, [key: string]: any } {
  return (
    feature &&
    feature.geometry &&
    feature.geometry.type === "Polygon" &&
    Array.isArray(feature.geometry.coordinates) &&
    Array.isArray(feature.geometry.coordinates[0]) &&
    Array.isArray(feature.geometry.coordinates[0][0])
  );
}

function rotateFeature(feature: any, angle: number) {
  if (!isPolygonFeature(feature)) {
    throw new Error("rotateFeature only supports Polygon features.");
  }
  const newFeature = JSON.parse(JSON.stringify(feature));
  const coordinates = newFeature.geometry.coordinates;
  const center = getCenter(coordinates);
  const rotatedCoordinates = coordinates.map((ring: number[][]) =>
    ring.map((point: number[]) => {
      const x = point[0] - center[0];
      const y = point[1] - center[1];
      const newX = x * Math.cos(angle * Math.PI / 180) - y * Math.sin(angle * Math.PI / 180);
      const newY = x * Math.sin(angle * Math.PI / 180) + y * Math.cos(angle * Math.PI / 180);
      return [newX + center[0], newY + center[1]];
    })
  );
  newFeature.geometry.coordinates = rotatedCoordinates;
  return newFeature;
}

interface TerraDrawingToolsProps {
  onNotificationDismissed?: () => void;
}

const TerraDrawingTools: React.FC<TerraDrawingToolsProps> = ({ 
  onNotificationDismissed
}) => {
  const { t } = useTranslation();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const historyRef = useRef<any[]>([]);
  const redoHistoryRef = useRef<any[]>([]);
  const selectedFeatureIdRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);
  const debounceTimeoutRef = useRef<number | undefined>(undefined);
  const resizingEnabledRef = useRef(false);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [polygonPaths, setPolygonPaths] = useState<string>("");
  const [polygonArea, setPolygonArea] = useState(0);
  const [open, setOpen] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showColorsLegend, setShowColorsLegend] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [selectedLandForNotification, setSelectedLandForNotification] = useState<LandRegistry | null>(null);

  // Dynamic map height based on screen size
  const dynamicHeight = useDynamicMapHeight(isFullscreen, {
    minHeight: 400,
    maxHeight: 1200,
    headerHeight: 60,
    toolbarHeight: 80,
    padding: 40
  });

  // Debug state changes
  useEffect(() => {
    console.log('Notification dialog state changed:', notificationDialogOpen);
    console.log('Selected land for notification:', selectedLandForNotification?.land_name);
  }, [notificationDialogOpen, selectedLandForNotification]);


  // Get authentication state
  const { isAuthenticated, user } = useAuthStore();

  // Get map store for land selection and centering
  const { selectedLand, shouldCenterMap, clearSelection, notificationContext } = useMapStore();

  // Ensure InfoWindow is initialized
  const ensureInfoWindow = () => {
    if (!infoWindowRef.current && mapInstanceRef.current) {
      console.log('Initializing InfoWindow...');
      console.log('Google Maps API version:', google.maps.version);
      console.log('Available InfoWindow methods:', Object.getOwnPropertyNames(google.maps.InfoWindow.prototype));
      
      try {
        infoWindowRef.current = new google.maps.InfoWindow({
          disableAutoPan: false,
          maxWidth: 300
        });
        console.log('InfoWindow initialized successfully');
      } catch (initError) {
        console.error('Error initializing InfoWindow:', initError);
        return false;
      }
    }
    return !!infoWindowRef.current;
  };

  // Only fetch lands data if user is authenticated
  const { data: lands, deleteItem, loading: landsLoading, error: landsError, fetchData, createItem } = useGenericCrud<LandRegistry>('lands');
  
  // Create global function for InfoWindow button
  useEffect(() => {
    (window as any).createNotificationForLand = (landIdentifier: string) => {
      console.log('Create notification button clicked for land:', landIdentifier);
      
      // Find the land by ID or land_code
      const selectedLand = lands?.find(land => 
        land.id?.toString() === landIdentifier || land.land_code === landIdentifier
      );
      
      if (selectedLand) {
        console.log('Found land:', selectedLand.land_name);
        setSelectedLandForNotification(selectedLand);
        setNotificationDialogOpen(true);
      } else {
        console.error('Land not found for identifier:', landIdentifier);
      }
    };

    // Cleanup function
    return () => {
      delete (window as any).createNotificationForLand;
    };
  }, [lands]);
  
  // Note: In development mode with React StrictMode, useEffect runs twice
  // This causes the API to be called twice, which is expected behavior
  // In production builds, this won't happen

  // Track if TerraDraw has been initialized
  const [terraDrawInitialized, setTerraDrawInitialized] = useState(false);
  const [polygonLoadAttempted, setPolygonLoadAttempted] = useState(false);


  // Enhanced polygon loading with retry mechanism
  const loadPolygonsToMap = useCallback(async () => {
    console.log('loadPolygonsToMap called with conditions:', {
      drawRef: !!drawRef.current,
      terraDrawInitialized,
      isAuthenticated,
      landsCount: lands?.length || 0,
      polygonLoadAttempted
    });

    if (!drawRef.current) {
      console.log('Polygon loading skipped - TerraDraw not ready');
      return;
    }

    if (!terraDrawInitialized) {
      console.log('Polygon loading skipped - TerraDraw not initialized');
      return;
    }

    if (!isAuthenticated) {
      console.log('Polygon loading skipped - user not authenticated');
      return;
    }

    if (!lands || !Array.isArray(lands) || lands.length === 0) {
      console.log('Polygon loading skipped - no lands data available');
      return;
    }

      console.log('✅ All conditions met - loading lands onto map:', lands.length, 'lands');
      
      try {
        // Check TerraDraw state
        console.log('TerraDraw instance:', drawRef.current);
        console.log('TerraDraw mode:', drawRef.current?.getMode());
        console.log('TerraDraw features count before clear:', drawRef.current?.getSnapshot().length || 0);
        
        // Additional debugging - check if TerraDraw is actually ready
        if (!drawRef.current.getSnapshot) {
          console.error('❌ TerraDraw getSnapshot method not available - TerraDraw may not be fully initialized');
          return;
        }
      
      // Clear existing features first to avoid duplicates
      drawRef.current.clear();
      console.log('TerraDraw features count after clear:', drawRef.current.getSnapshot().length || 0);
      
      let loadedCount = 0;
      let errorCount = 0;
      
      for (const land of lands) {
        console.log(`🔍 Processing land: ${land.land_name} (ID: ${land.id})`);
        
        if (!land.coordinations) {
          console.log('❌ Land has no coordinations:', land.land_name);
          continue;
        }
        
        console.log('📊 Coordinations data preview:', {
          length: land.coordinations.length,
          preview: land.coordinations.substring(0, 200) + '...',
          startsWithBrace: land.coordinations.trim().startsWith('{'),
          startsWithBracket: land.coordinations.trim().startsWith('[')
        });
        
        try {
          const geojson = JSON.parse(land.coordinations);
          console.log('✅ Parsed GeoJSON for land:', land.land_name, {
            type: geojson.type,
            hasGeometry: !!geojson.geometry,
            geometryType: geojson.geometry?.type,
            hasCoordinates: !!geojson.geometry?.coordinates,
            coordinatesLength: geojson.geometry?.coordinates?.length
          });
          
          if (geojson.type === "Feature") {
            console.log('Adding Feature to TerraDraw:', geojson);
            try {
              drawRef.current!.addFeatures([geojson]);
              loadedCount++;
              console.log('✅ Successfully loaded land feature:', land.land_name);
            } catch (addError) {
              console.error('❌ Error adding feature to TerraDraw:', addError);
              console.error('Feature that failed:', geojson);
              errorCount++;
            }
          } else if (
            geojson.type === "FeatureCollection" &&
            Array.isArray(geojson.features)
          ) {
            console.log('Adding FeatureCollection to TerraDraw:', geojson.features);
            try {
              drawRef.current!.addFeatures(geojson.features);
              loadedCount += geojson.features.length;
              console.log('✅ Successfully loaded land feature collection:', land.land_name, geojson.features.length, 'features');
            } catch (addError) {
              console.error('❌ Error adding FeatureCollection to TerraDraw:', addError);
              console.error('FeatureCollection that failed:', geojson);
              errorCount++;
            }
          } else if (geojson.type === "Polygon" || geojson.type === "Point" || geojson.type === "LineString") {
            // Handle raw geometry types by converting them to Features
            console.log('Converting raw geometry to Feature for land:', land.land_name, 'Type:', geojson.type);
            const feature = {
              type: "Feature" as const,
              geometry: geojson,
              properties: {
                mode: geojson.type.toLowerCase(),
                landId: land.id,
                landName: land.land_name,
                landCode: land.land_code
              }
            };
            console.log('Adding converted Feature to TerraDraw:', feature);
            try {
              drawRef.current!.addFeatures([feature]);
              loadedCount++;
              console.log('✅ Successfully converted and loaded land geometry:', land.land_name);
            } catch (addError) {
              console.error('❌ Error adding converted feature to TerraDraw:', addError);
              console.error('Converted feature that failed:', feature);
              errorCount++;
            }
          } else {
            console.warn('⚠️ Unknown GeoJSON type for land:', land.land_name, 'Type:', geojson.type);
            errorCount++;
          }
        } catch (e) {
          console.error('❌ Invalid geojson data for land:', land.land_name, e);
          console.error('Raw coordinations data:', land.coordinations);
          errorCount++;
        }
      }
      
      console.log('Polygon loading complete:', { loadedCount, errorCount, totalLands: lands.length });
      
      // Check final TerraDraw state
      const finalSnapshot = drawRef.current.getSnapshot();
      console.log('TerraDraw features count after loading:', finalSnapshot.length);
      
      // If no features were loaded but we had lands, there might be an issue
      if (loadedCount === 0 && lands.length > 0) {
        console.warn('⚠️ No polygons were loaded despite having lands data. This might indicate a TerraDraw issue.');
        console.log('Available lands for debugging:', lands.map(land => ({
          id: land.id,
          name: land.land_name,
          code: land.land_code,
          hasCoordinations: !!land.coordinations,
          coordinationsLength: land.coordinations?.length || 0
        })));
        
        // Retry after a short delay
        setTimeout(() => {
          if (!polygonLoadAttempted) {
            console.log('Retrying polygon loading...');
            setPolygonLoadAttempted(true);
            loadPolygonsToMap();
          }
        }, 2000); // Increased delay to 2 seconds
      }
      
    } catch (error) {
      console.error('Error during polygon loading:', error);
    }
  }, [lands, terraDrawInitialized, isAuthenticated, polygonLoadAttempted]);

  useEffect(() => {
    // Debug logging
    console.log('TerraDrawingTools - useEffect triggered:', {
      isAuthenticated,
      user: user?.first_name,
      landsLoading,
      landsError: landsError?.message,
      landsCount: lands?.length || 0,
      terraDrawInitialized,
      polygonLoadAttempted
    });

    // Load polygons when all conditions are met - with better timing
    if (isAuthenticated && !landsLoading && !landsError && lands && Array.isArray(lands) && lands.length > 0 && terraDrawInitialized) {
      console.log('✅ All conditions met for polygon loading - calling loadPolygonsToMap');
      // Add a small delay to ensure TerraDraw is fully ready
      setTimeout(() => {
        loadPolygonsToMap();
      }, 50);
    } else if (!isAuthenticated) {
      console.log('❌ User not authenticated, skipping land loading');
    } else if (landsLoading) {
      console.log('⏳ Still loading lands data...');
    } else if (landsError) {
      console.error('❌ Error loading lands:', landsError);
    } else if (!lands || lands.length === 0) {
      console.log('⚠️ No lands data available or empty lands array');
    } else if (!terraDrawInitialized) {
      console.log('⏳ TerraDraw not initialized yet');
    }
  }, [lands, terraDrawInitialized, isAuthenticated, landsLoading, landsError, loadPolygonsToMap]);

  // Fallback mechanism to ensure polygons are loaded
  useEffect(() => {
    if (terraDrawInitialized && isAuthenticated && lands && lands.length > 0) {
      // Set up a fallback timer to load polygons if they haven't been loaded yet
      const fallbackTimer = setTimeout(() => {
        const currentFeatures = drawRef.current?.getSnapshot() || [];
        const hasLandFeatures = currentFeatures.some(feature => 
          feature.properties?.landId || feature.properties?.landName
        );
        
        if (!hasLandFeatures) {
          console.log('🔄 Fallback: Loading polygons after delay');
          loadPolygonsToMap();
        }
      }, 2000); // 2 second fallback
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [terraDrawInitialized, isAuthenticated, lands, loadPolygonsToMap]);

  // Update markers when lands data changes
  useEffect(() => {
    if (lands && Array.isArray(lands) && mapInstanceRef.current) {
      createPolygonMarkers(mapInstanceRef.current);
    }
  }, [lands]);

  // Handle map centering when a land is selected from the Lands tab
  useEffect(() => {
    console.log('Map centering useEffect triggered:', {
      selectedLand: selectedLand?.land_name,
      shouldCenterMap,
      mapInstance: !!mapInstanceRef.current,
      drawRef: !!drawRef.current,
      markersCount: markersRef.current.length,
      terraDrawInitialized
    });

    // Add a small delay to ensure map is fully ready
    if (selectedLand && shouldCenterMap && mapInstanceRef.current && drawRef.current && terraDrawInitialized) {
      console.log('Starting map centering for land:', selectedLand.land_name);
      
      try {
        // Parse the land's geometry to get coordinates
        const geojson = JSON.parse(selectedLand.coordinations);
        console.log('Parsed GeoJSON:', geojson);
        
        // Handle both Feature and raw geometry types
        let coordinates;
        if (geojson.type === "Feature" && geojson.geometry && geojson.geometry.coordinates) {
          coordinates = geojson.geometry.coordinates[0]; // First ring of polygon
          console.log('Using Feature geometry coordinates');
        } else if (geojson.type === "Polygon" && geojson.coordinates) {
          coordinates = geojson.coordinates[0]; // First ring of polygon
          console.log('Using raw Polygon coordinates');
        } else {
          console.error('Unable to extract coordinates from land geometry:', geojson);
          return;
        }
        
        if (coordinates && coordinates.length > 0) {
          console.log('Coordinates found:', coordinates.length, 'points');
          
          // Calculate center point of the polygon
          let centerLat = 0;
          let centerLng = 0;
          coordinates.forEach((coord: [number, number]) => {
            centerLng += coord[0];
            centerLat += coord[1];
          });
          centerLat /= coordinates.length;
          centerLng /= coordinates.length;
          
          console.log('Calculated center:', { lat: centerLat, lng: centerLng });
          
          // Center the map on the land
          mapInstanceRef.current.setCenter({ lat: centerLat, lng: centerLng });
          mapInstanceRef.current.setZoom(16); // Zoom in to show the land clearly
          console.log('Map centered and zoomed');
          
          // Find and highlight the corresponding marker
          console.log('Looking for marker with title:', `Land Code: ${selectedLand.land_code}`);
          console.log('Available markers:', markersRef.current.map(m => m.title));
          console.log('Land code from selected land:', selectedLand.land_code);
          
          const marker = markersRef.current.find(m => 
            m.title === `Land Code: ${selectedLand.land_code}`
          );
          
          console.log('Found marker:', !!marker);
          if (marker) {
            console.log('Marker details:', {
              title: marker.title,
              position: marker.position?.toString(),
              map: marker.map?.toString()
            });
          }
          
          // Ensure InfoWindow is initialized
          const infoWindowReady = ensureInfoWindow();
          console.log('InfoWindow ready:', infoWindowReady);
          
          if (infoWindowRef.current) {
            console.log('InfoWindow details:', {
              isOpen: !!infoWindowRef.current.getContent?.(),
              content: typeof infoWindowRef.current.getContent?.() === 'string' 
                ? (infoWindowRef.current.getContent() as string)?.substring(0, 100) + '...'
                : 'HTML content'
            });
          }
          
          if (marker && infoWindowReady) {
            // Show InfoWindow for the selected land
            // Handle both LandRegistry and extended Land types
            const plantTypeName = getTranslatedPlantType(t, (selectedLand as any).plant_type_name || 'Unknown', (selectedLand as any).plant_type_translation_key);
            const categoryName = getTranslatedCategory(t, (selectedLand as any).category_name || 'Unknown', (selectedLand as any).category_translation_key);
            const harvestStatus = (selectedLand as any).harvest_status || 'normal';
            const nextHarvestDate = (selectedLand as any).next_harvest_date || new Date().toISOString();
            const formattedSize = formatLandSizeToThaiUnits(selectedLand.size, t);
            
            // Check if we have notification context to display
            const hasNotification = notificationContext !== null;
            const notificationSection = hasNotification ? `
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="background: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                    <span style="font-size: 16px;">🔔</span>
                  </div>
                  <strong style="color: white; font-size: 14px;">${t('notifications.notification').toUpperCase()}</strong>
                </div>
                <div style="background: rgba(255,255,255,0.95); padding: 10px; border-radius: 6px;">
                  <div style="font-weight: 700; font-size: 14px; color: #1a202c; margin-bottom: 6px;">${notificationContext.title}</div>
                  <div style="color: #4a5568; font-size: 13px; line-height: 1.5; margin-bottom: 8px; white-space: pre-wrap;">${notificationContext.message}</div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
                    <span style="background: ${notificationContext.priority === 'high' ? '#ef4444' : notificationContext.priority === 'medium' ? '#f59e0b' : '#10b981'}; color: white; padding: 2px 8px; border-radius: 12px; font-weight: 600; text-transform: uppercase;">
                      ${notificationContext.priority}
                    </span>
                    <span style="color: #718096;">${new Date(notificationContext.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ` : '';
            
            const infoContent = `
              <div style="font-family: Arial, sans-serif; max-width: 320px;">
                ${notificationSection}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                  <div style="background: #f8f9fa; padding: 8px; border-radius: 4px;">
                    <strong style="color: #495057; font-size: 12px;">${t('labels.landName').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${selectedLand.land_name}</div>
                  </div>
                  <div style="background: #e3f2fd; padding: 8px; border-radius: 4px;">
                    <strong style="color: #1976d2; font-size: 12px;">${t('labels.landCode').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${selectedLand.land_code}</div>
                  </div>
                  <div style="background: #f3e5f5; padding: 8px; border-radius: 4px;">
                    <strong style="color: #7b1fa2; font-size: 12px;">${t('labels.size').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${formattedSize}</div>
                  </div>
                  ${selectedLand.palm_area ? `
                  <div style="background: #e1f5fe; padding: 8px; border-radius: 4px;">
                    <strong style="color: #0277bd; font-size: 12px;">${t('labels.palmArea').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${formatLandSizeToThaiUnits(selectedLand.palm_area, t)}</div>
                  </div>
                  ` : ''}
                  <div style="background: #e8f5e8; padding: 8px; border-radius: 4px;">
                    <strong style="color: #388e3c; font-size: 12px;">${t('labels.plantType').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${plantTypeName}</div>
                  </div>
                  <div style="background: #fff3e0; padding: 8px; border-radius: 4px;">
                    <strong style="color: #f57c00; font-size: 12px;">${t('labels.category').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${categoryName}</div>
                  </div>
                  <div style="background: #fce4ec; padding: 8px; border-radius: 4px;">
                    <strong style="color: #c2185b; font-size: 12px;">HARVEST STATUS</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px; text-transform: capitalize;">${harvestStatus}</div>
                  </div>
                </div>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-top: 8px;">
                  <strong style="color: #495057; font-size: 12px;">${t('labels.location').toUpperCase()}</strong>
                  <div style="color: #212529; margin-top: 2px;">${selectedLand.location}, ${selectedLand.city}, ${selectedLand.district}, ${selectedLand.province}</div>
                </div>
                <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin-top: 8px;">
                  <strong style="color: #1976d2; font-size: 12px;">${t('labels.nextHarvest').toUpperCase()}</strong>
                  <div style="color: #212529; margin-top: 2px;">${new Date(nextHarvestDate).toLocaleDateString()}</div>
                </div>
              </div>
            `;
            
            console.log('Setting InfoWindow content and opening...');
            console.log('InfoWindow content length:', infoContent.length);
            console.log('Opening InfoWindow with marker:', marker.title);
            
            try {
              // Close any existing InfoWindow first
              if (infoWindowRef.current && infoWindowRef.current.getContent?.()) {
                console.log('Closing existing InfoWindow...');
                infoWindowRef.current.close();
              }
              
              // Set content
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(infoContent);
              }
              console.log('InfoWindow content set successfully');
              
              // Try different opening methods
              console.log('Attempting to open InfoWindow...');
              
              // Method 1: Open with map and marker (only for standard markers)
              try {
                if (marker.constructor.name === 'Marker' && infoWindowRef.current) {
                  infoWindowRef.current.open(mapInstanceRef.current, marker);
                  console.log('InfoWindow opened with map and standard marker');
                } else {
                  // For AdvancedMarkerElement, use position-based opening
                  throw new Error('AdvancedMarkerElement detected, using position-based opening');
                }
              } catch (method1Error) {
                console.warn('Method 1 failed, trying method 2:', method1Error);
                
                // Method 2: Open with map and position
                try {
                  console.log('Marker type:', marker.constructor.name);
                  let markerPosition;
                  
                  if (marker.position) {
                    markerPosition = marker.position;
                    console.log('Got position from marker.position (AdvancedMarkerElement):', markerPosition);
                  } else if (typeof (marker as any).getPosition === 'function') {
                    markerPosition = (marker as any).getPosition();
                    console.log('Got position from getPosition() (standard Marker):', markerPosition);
                  } else if ((marker as any).lat && (marker as any).lng) {
                    markerPosition = { lat: (marker as any).lat, lng: (marker as any).lng };
                    console.log('Got position from lat/lng:', markerPosition);
                  } else {
                    console.log('Using center coordinates as fallback');
                    markerPosition = { lat: centerLat, lng: centerLng };
                  }
                  
                  if (infoWindowRef.current) {
                    infoWindowRef.current.setPosition(markerPosition);
                    infoWindowRef.current.open(mapInstanceRef.current);
                  }
                  console.log('InfoWindow opened with map and position');
                } catch (method2Error) {
                  console.warn('Method 2 failed, trying method 3:', method2Error);
                  
                  // Method 3: Just open with map
                  if (infoWindowRef.current) {
                    infoWindowRef.current.open(mapInstanceRef.current);
                  }
                  console.log('InfoWindow opened with map only');
                }
              }
              
              // Verify InfoWindow is actually open
              setTimeout(() => {
                const isOpen = !!infoWindowRef.current?.getContent?.();
                console.log('InfoWindow verification - is open:', isOpen);
                if (!isOpen) {
                  console.error('InfoWindow failed to open properly');
                  console.log('Trying fallback method...');
                  
                  // Fallback: Try opening without marker
                  try {
                    console.log('Marker type:', marker.constructor.name);
                    console.log('Marker methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(marker)));
                    
                    let markerPosition;
                    if (marker.position) {
                      markerPosition = marker.position;
                      console.log('Got position from marker.position (AdvancedMarkerElement):', markerPosition);
                    } else if (typeof (marker as any).getPosition === 'function') {
                      markerPosition = (marker as any).getPosition();
                      console.log('Got position from getPosition() (standard Marker):', markerPosition);
                    } else if ((marker as any).lat && (marker as any).lng) {
                      markerPosition = { lat: (marker as any).lat, lng: (marker as any).lng };
                      console.log('Got position from lat/lng:', markerPosition);
                    } else {
                      console.log('Using center coordinates as fallback');
                      markerPosition = { lat: centerLat, lng: centerLng };
                    }
                    
                    if (infoWindowRef.current) {
                      infoWindowRef.current.setPosition(markerPosition);
                      infoWindowRef.current.open(mapInstanceRef.current);
                    }
                    console.log('Fallback InfoWindow opened');
                  } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                  }
                }
              }, 200);
            } catch (error) {
              console.error('Error opening InfoWindow:', error);
            }
          } else {
            console.warn('Marker or InfoWindow not found. Creating InfoWindow at center point...');
            
            // Fallback: Create InfoWindow at the center point if no marker found
            const infoWindowReady = ensureInfoWindow();
            if (infoWindowReady) {
              const formattedSize = formatLandSizeToThaiUnits(selectedLand.size, t);
              const infoContent = `
                <div style="font-family: Arial, sans-serif; max-width: 300px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px;">
                      <strong style="color: #495057; font-size: 12px;">LAND NAME</strong>
                      <div style="color: #212529; font-weight: 600; margin-top: 2px;">${selectedLand.land_name}</div>
                    </div>
                    <div style="background: #e3f2fd; padding: 8px; border-radius: 4px;">
                      <strong style="color: #1976d2; font-size: 12px;">LAND CODE</strong>
                      <div style="color: #212529; font-weight: 600; margin-top: 2px;">${selectedLand.land_code}</div>
                    </div>
                    <div style="background: #f3e5f5; padding: 8px; border-radius: 4px;">
                      <strong style="color: #7b1fa2; font-size: 12px;">SIZE</strong>
                      <div style="color: #212529; font-weight: 600; margin-top: 2px;">${formattedSize}</div>
                    </div>
                    ${selectedLand.palm_area ? `
                    <div style="background: #e1f5fe; padding: 8px; border-radius: 4px;">
                      <strong style="color: #0277bd; font-size: 12px;">PALM AREA</strong>
                      <div style="color: #212529; font-weight: 600; margin-top: 2px;">${formatLandSizeToThaiUnits(selectedLand.palm_area, t)}</div>
                    </div>
                    ` : ''}
                    <div style="background: #e8f5e8; padding: 8px; border-radius: 4px;">
                      <strong style="color: #388e3c; font-size: 12px;">LOCATION</strong>
                      <div style="color: #212529; font-weight: 600; margin-top: 2px;">${selectedLand.location}</div>
                    </div>
                  </div>
                  <div style="background: #fff3e0; padding: 8px; border-radius: 4px; margin-top: 8px;">
                    <strong style="color: #f57c00; font-size: 12px;">NOTE</strong>
                    <div style="color: #212529; margin-top: 2px;">Land marker not found, showing at center point</div>
                  </div>
                </div>
              `;
              
              console.log('Setting fallback InfoWindow content and opening...');
              console.log('Fallback InfoWindow content length:', infoContent.length);
              console.log('Fallback InfoWindow position:', { lat: centerLat, lng: centerLng });
              
              try {
                // Close any existing InfoWindow first
                if (infoWindowRef.current && infoWindowRef.current.getContent?.()) {
                  console.log('Closing existing InfoWindow for fallback...');
                  infoWindowRef.current.close();
                }
                
                // Set content and position
                if (infoWindowRef.current) {
                  infoWindowRef.current.setContent(infoContent);
                  console.log('Fallback InfoWindow content set successfully');
                  
                  infoWindowRef.current.setPosition({ lat: centerLat, lng: centerLng });
                }
                console.log('Fallback InfoWindow position set successfully');
                
                // Try opening with different methods
                console.log('Attempting to open fallback InfoWindow...');
                
                try {
                  if (infoWindowRef.current) {
                    infoWindowRef.current.open(mapInstanceRef.current);
                    console.log('Fallback InfoWindow opened successfully');
                  }
                } catch (openError) {
                  console.warn('Fallback opening failed, trying alternative:', openError);
                  
                  // Alternative: Create new InfoWindow
                  try {
                    const newInfoWindow = new google.maps.InfoWindow({
                      content: infoContent,
                      position: { lat: centerLat, lng: centerLng }
                    });
                    newInfoWindow.open(mapInstanceRef.current);
                    console.log('New InfoWindow created and opened');
                  } catch (newWindowError) {
                    console.error('Creating new InfoWindow also failed:', newWindowError);
                  }
                }
                
                // Verify fallback InfoWindow is actually open
                setTimeout(() => {
                  const isOpen = !!infoWindowRef.current?.getContent?.();
                  console.log('Fallback InfoWindow verification - is open:', isOpen);
                  if (!isOpen) {
                    console.error('Fallback InfoWindow failed to open properly');
                  }
                }, 200);
              } catch (error) {
                console.error('Error opening fallback InfoWindow:', error);
              }
            }
          }
        } else {
          console.error('No coordinates found for land:', selectedLand.land_name);
        }
      } catch (error) {
        console.error('Error parsing land geometry:', error);
      }
      
      // Clear the centering flag after centering with a small delay
      setTimeout(() => {
        clearSelection();
        console.log('Cleared selection after centering');
      }, 100);
    } else {
      console.log('Map centering conditions not met:', {
        selectedLand: !!selectedLand,
        shouldCenterMap,
        mapInstance: !!mapInstanceRef.current,
        drawRef: !!drawRef.current
      });
    }
  }, [selectedLand, shouldCenterMap, clearSelection, terraDrawInitialized]);

  const deletePolygon = (id: string) => {
    if (drawRef.current) {
      const poly = lands!.find((land) => {
        if (!land.coordinations) return;
        try {
          const geojson = JSON.parse(land.coordinations);
          return geojson.id === id;
        } catch (e) {
          // Invalid geojson data - skip this land
        }
      });
      if (poly) {
        drawRef.current.removeFeatures([id]);
        // Call API to delete from backend
        deleteItem(poly.id);
        
        // Remove corresponding marker
        const markerIndex = markersRef.current.findIndex(marker => 
          marker.title === `Land Code: ${poly.land_code}`
        );
        if (markerIndex !== -1) {
          markersRef.current[markerIndex].map = null;
          markersRef.current.splice(markerIndex, 1);
        }
      }
    }
  };

  // Function to create markers for polygons
  const createPolygonMarkers = (map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    if (!lands || !Array.isArray(lands)) return;

    lands.forEach((land) => {
      if (!land.coordinations) return;

      try {
        const geojson = JSON.parse(land.coordinations);
        
        // Handle both Feature and FeatureCollection
        const features = geojson.type === "Feature" ? [geojson] : 
                        geojson.type === "FeatureCollection" ? geojson.features : [];

        features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === "Polygon" && feature.geometry.coordinates) {
            const coordinates = feature.geometry.coordinates[0]; // First ring of polygon
            
            // Calculate center point
            let totalLat = 0;
            let totalLng = 0;
            coordinates.forEach((coord: number[]) => {
              totalLng += coord[0]; // longitude
              totalLat += coord[1]; // latitude
            });
            
            const centerLat = totalLat / coordinates.length;
            const centerLng = totalLng / coordinates.length;
            
            // Create marker content element
            const markerElement = document.createElement('div');
            // Get background color using database category color (primary) or plant type color (fallback)
            const backgroundColor = getMarkerBackgroundColor({
              category_color: land.category_color,
              planttypeid: land.planttypeid
            });
            
            // Debug: Log color source to verify it's using database colors
            console.log(`${land.land_name} (${land.land_code}): Category Color: ${land.category_color}, Used Color: ${backgroundColor}`);
            
            markerElement.innerHTML = `
              <div style="
                width: 60px; 
                height: 60px; 
                background: ${backgroundColor}; 
                border: 3px solid #ffffff; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: all 0.2s ease;
              " 
              onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.3)'"
              title={t('maps.viewDetailsTooltip')}
              >
                <span style="
                  color: white; 
                  font-family: Arial, sans-serif; 
                  font-size: 16px; 
                  font-weight: bold;
                  text-align: center;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                  ">${land.land_code}</span>
              </div>
            `;

            // Create AdvancedMarkerElement
            const marker = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: centerLat, lng: centerLng },
              map: showMarkers ? map : null,
              title: `Land Code: ${land.land_code}`,
              content: markerElement.firstElementChild as HTMLElement,
            });

            console.log('Created marker for land:', land.land_name, 'with position:', { lat: centerLat, lng: centerLng });

            // Add click event to marker
            marker.addListener('click', () => {
              // Get extended land data
              const plantTypeName = getTranslatedPlantType(t, (land as any).plant_type_name || 'Unknown', (land as any).plant_type_translation_key);
              const categoryName = getTranslatedCategory(t, (land as any).category_name || 'Unknown', (land as any).category_translation_key);
              const harvestStatus = (land as any).harvest_status || 'normal';
              const nextHarvestDate = (land as any).next_harvest_date || new Date().toISOString();
              const formattedSize = formatLandSizeToThaiUnits(land.size, t);
              
              // Create InfoWindow content with two-column layout
              const infoContent = `
                <div style="font-family: Arial, sans-serif; max-width: 300px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                  <div style="background: #f8f9fa; padding: 8px; border-radius: 4px;">
                    <strong style="color: #495057; font-size: 12px;">${t('labels.landName').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${land.land_name}</div>
                  </div>
                  <div style="background: #e3f2fd; padding: 8px; border-radius: 4px;">
                    <strong style="color: #1976d2; font-size: 12px;">${t('labels.landCode').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${land.land_code}</div>
                  </div>
                  <div style="background: #f3e5f5; padding: 8px; border-radius: 4px;">
                    <strong style="color: #7b1fa2; font-size: 12px;">${t('labels.size').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${formattedSize}</div>
                  </div>
                  ${land.palm_area ? `
                  <div style="background: #e1f5fe; padding: 8px; border-radius: 4px;">
                    <strong style="color: #0277bd; font-size: 12px;">${t('labels.palmArea').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${formatLandSizeToThaiUnits(land.palm_area, t)}</div>
                  </div>
                  ` : ''}
                  <div style="background: #e8f5e8; padding: 8px; border-radius: 4px;">
                    <strong style="color: #388e3c; font-size: 12px;">${t('labels.plantType').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${plantTypeName}</div>
                  </div>
                  <div style="background: #fff3e0; padding: 8px; border-radius: 4px;">
                    <strong style="color: #f57c00; font-size: 12px;">${t('labels.category').toUpperCase()}</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px;">${categoryName}</div>
                  </div>
                  <div style="background: #fce4ec; padding: 8px; border-radius: 4px;">
                    <strong style="color: #c2185b; font-size: 12px;">HARVEST STATUS</strong>
                    <div style="color: #212529; font-weight: 600; margin-top: 2px; text-transform: capitalize;">${harvestStatus}</div>
                  </div>
                </div>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-top: 8px;">
                  <strong style="color: #495057; font-size: 12px;">${t('labels.location').toUpperCase()}</strong>
                  <div style="color: #212529; margin-top: 2px;">${land.location}, ${land.city}, ${land.district}, ${land.province}</div>
                </div>
                <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin-top: 8px;">
                  <strong style="color: #1976d2; font-size: 12px;">${t('labels.nextHarvest').toUpperCase()}</strong>
                  <div style="color: #212529; margin-top: 2px;">${new Date(nextHarvestDate).toLocaleDateString()}</div>
                </div>
              </div>
                  
                  ${land.harvest_cycle ? `
                    <div style="margin-bottom: 10px; padding: 8px; background-color: #e8f5e8; border-radius: 4px; border-left: 3px solid #34A853;">
                      <strong style="color: #333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Harvest Cycle</strong><br/>
                      <span style="color: #666; font-size: 14px;">${land.harvest_cycle}</span>
                    </div>
                  ` : ''}
                  
                  ${land.notes ? `
                    <div style="margin-bottom: 10px; padding: 8px; background-color: #fff3cd; border-radius: 4px; border-left: 3px solid #FBBC04;">
                      <strong style="color: #333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</strong><br/>
                      <span style="color: #666; font-size: 14px;">${land.notes}</span>
                    </div>
                  ` : ''}
                  
                  <div style="margin-top: 15px; padding: 10px; background-color: #f1f3f4; border-radius: 4px; border-top: 1px solid #dadce0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div>
                        <strong style="color: #333; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Created</strong><br/>
                        <small style="color: #666; font-size: 12px;">${new Date(land.created).toLocaleDateString()}</small>
                      </div>
                      <div>
                        <strong style="color: #333; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Created By</strong><br/>
                        <small style="color: #666; font-size: 12px;">${land.createdby}</small>
                      </div>
                    </div>
                  </div>
                  
                  <div style="margin-top: 12px; text-align: center;">
                    <button 
                      id="create-notification-btn-${land.id || land.land_code}" 
                      style="
                        background: linear-gradient(135deg, #4285F4, #34A853);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      "
                      onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
                      onclick="window.createNotificationForLand && window.createNotificationForLand('${land.id || land.land_code}')"
                    >
                      📝 Create Notification
                    </button>
                  </div>
                </div>
              `;

              // Create or update InfoWindow
              if (!infoWindowRef.current) {
                infoWindowRef.current = new google.maps.InfoWindow();
              }
              
              infoWindowRef.current.setContent(infoContent);
              infoWindowRef.current.open(map, marker);
            });

            // Add right-click event to marker for creating notifications
            // Try both AdvancedMarkerElement and the content element
            try {
              marker.addListener('rightclick', () => {
                console.log('Right-click detected on marker:', land.land_name);
                // Store the selected land for notification creation
                setSelectedLandForNotification(land);
                setNotificationDialogOpen(true);
                console.log('Notification dialog should open now');
              });
            } catch (error) {
              console.log('AdvancedMarkerElement rightclick not supported, trying content element');
            }

            // Also add right-click to the marker content element as fallback
            const markerContent = markerElement.firstElementChild as HTMLElement;
            if (markerContent) {
              markerContent.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                console.log('Right-click detected on marker content:', land.land_name);
                // Store the selected land for notification creation
                setSelectedLandForNotification(land);
                setNotificationDialogOpen(true);
                console.log('Notification dialog should open now');
              });
            }

            markersRef.current.push(marker);
          }
        });
        } catch (e) {
          // Invalid geojson data - skip this land
        }
    });
  };

  // Function to toggle marker visibility
  const toggleMarkers = () => {
    setShowMarkers(!showMarkers);
    markersRef.current.forEach(marker => {
      marker.map = showMarkers ? null : mapInstanceRef.current;
    });
  };

  // Function to toggle color legend
  const toggleColorsLegend = () => {
    setShowColorsLegend(!showColorsLegend);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Trigger map resize after a short delay to ensure DOM updates
    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }
    }, 100);
  };

  // Function to refresh lands data
  const refreshLandsData = async () => {
    console.log('🔄 Refreshing lands data...');
    setPolygonLoadAttempted(false); // Reset retry flag
    await fetchData();
  };

  // Function to manually reload polygons
  const reloadPolygons = () => {
    console.log('🔄 Manually reloading polygons...');
    console.log('Current state:', {
      drawRef: !!drawRef.current,
      terraDrawInitialized,
      isAuthenticated,
      landsCount: lands?.length || 0,
      polygonLoadAttempted
    });
    
    setPolygonLoadAttempted(false); // Reset retry flag
    
    if (drawRef.current && terraDrawInitialized && isAuthenticated && lands && Array.isArray(lands) && lands.length > 0) {
      console.log('✅ All conditions met for manual reload');
      loadPolygonsToMap();
    } else {
      console.log('❌ Cannot reload polygons - conditions not met:', {
        drawRef: !!drawRef.current,
        terraDrawInitialized,
        isAuthenticated,
        hasLands: !!lands,
        landsCount: lands?.length || 0
      });
    }
  };

  // Handle keyboard events for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => {
          if (mapInstanceRef.current) {
            google.maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        }, 100);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen]);

  useEffect(() => {
    let map: google.maps.Map;

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["maps", "drawing", "marker"],
    });

    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

      if (!mapRef.current) {
        return;
      }
      map = new Map(mapRef.current, {
        center: { lat: 14.09480,lng: 99.82120 },
        zoom: 16,
        mapId: "c306b3c6dd3ed8d9",
        mapTypeId: "satellite",
        zoomControl: false,
        tilt: 0,
        mapTypeControl: true,
        clickableIcons: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Store map instance for later use
      mapInstanceRef.current = map;

      // Create markers for existing polygons when map is ready
      if (lands && Array.isArray(lands)) {
        createPolygonMarkers(map);
      }

      // Move all event listeners inside loader.load().then to ensure map is initialized
      if (map) {
        map.addListener("click", () => {
          // Close InfoWindow when clicking on map
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
        });

        map.addListener("projection_changed", () => {
          // Add defensive checks to prevent addEventListener error
          setTimeout(() => {
            try {
              // Check if map container still exists and is in DOM
              if (!mapRef.current) {
                return;
              }

              if (!document.contains(mapRef.current)) {
                return;
              }

              // Check if map div has proper dimensions
              const mapDiv = mapRef.current;
              if (mapDiv.offsetWidth === 0 || mapDiv.offsetHeight === 0) {
                return;
              }

          const draw = new TerraDraw({
            adapter: new TerraDrawGoogleMapsAdapter({ map, lib: google.maps, coordinatePrecision: 9 }),
            modes: [
              new TerraDrawSelectMode({
                flags: {
                  polygon: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                  linestring: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                  point: { feature: { draggable: true, rotateable: true } },
                  rectangle: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                  circle: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                  freehand: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                },
              }),
              new TerraDrawPointMode({ editable: true, styles: { pointColor: getRandomColor() } }),
              new TerraDrawLineStringMode({ editable: true, styles: { lineStringColor: getRandomColor() } }),
              new TerraDrawPolygonMode({
                editable: true,
                styles: (() => {
                  const color = getRandomColor();
                  return { fillColor: color, outlineColor: color };
                })(),
              }),
              new TerraDrawRectangleMode({
                styles: (() => {
                  const color = getRandomColor();
                  return { fillColor: color, outlineColor: color };
                })(),
              }),
              new TerraDrawCircleMode({
                styles: (() => {
                  const color = getRandomColor();
                  return { fillColor: color, outlineColor: color };
                })(),
              }),
              new TerraDrawFreehandMode({
                styles: (() => {
                  const color = getRandomColor();
                  return { fillColor: color, outlineColor: color };
                })(),
              }),
            ],
          });

          drawRef.current = draw;

              // Add event listeners before starting
              draw.on("finish", (features) => {
            if (features.toString() === "") return;

            const allFeatures = draw.getSnapshot();
            const lastFeature = allFeatures.length > 0 ? allFeatures[allFeatures.length - 1] : null;
            // Calculate area if lastFeature is a Polygon

            if (lastFeature?.geometry?.type === "Polygon" && lastFeature.geometry.coordinates) {
              // Use Shoelace formula for area calculation (assuming coordinates are [lng, lat])
                const ring = lastFeature.geometry.coordinates[0];
                // Convert to google.maps.MVCArray<google.maps.LatLng>
                const latLngArray = ring.map(([lng, lat]) => new google.maps.LatLng(lat, lng));
                const mvcArray = new google.maps.MVCArray(latLngArray);
                const area = google.maps.geometry.spherical.computeArea(mvcArray);
                setPolygonArea(area/1600); // Convert to rai (1 rai = 1600 sqm)
            }
            
            setPolygonPaths(JSON.stringify(lastFeature));
            setOpen(true);
          });

          draw.on("ready", () => {
                console.log('🎯 TerraDraw ready event fired');
                draw.setMode("select"); // Set select as default mode
            historyRef.current.push(processSnapshotForUndo(draw.getSnapshot()));
                
                // Set the select button as active after TerraDraw is ready
                setActiveButton("select-mode");

            draw.on("select", (id) => {
              if (selectedFeatureIdRef.current && selectedFeatureIdRef.current !== id) {
                draw.deselectFeature(selectedFeatureIdRef.current);
              }
              selectedFeatureIdRef.current = id as string;
            });

            draw.on("deselect", () => {
              selectedFeatureIdRef.current = null;
            });

            draw.on("change", () => {
              if (isRestoringRef.current) return;
              if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
              
              debounceTimeoutRef.current = window.setTimeout(() => {
              const snapshot = draw.getSnapshot();
              const processedSnapshot = processSnapshotForUndo(snapshot);
              const filteredSnapshot = processedSnapshot.filter(
                (f) => !f.properties.midPoint && !f.properties.selectionPoint
              );
              historyRef.current.push(filteredSnapshot);
              redoHistoryRef.current = [];
              }, 200);
            });

                // Mark TerraDraw as initialized and ready to receive data - MOVED INSIDE READY EVENT
                setTerraDrawInitialized(true);
                console.log('✅ TerraDraw initialized successfully');
                
                // Try to load polygons immediately if we have lands data
                setTimeout(() => {
                  console.log('🔍 Checking if we can load polygons after TerraDraw ready...');
                  if (isAuthenticated && lands && Array.isArray(lands) && lands.length > 0) {
                    console.log('🚀 Loading polygons after TerraDraw ready event');
                    loadPolygonsToMap();
                  } else {
                    console.log('⏳ Waiting for lands data after TerraDraw ready');
                  }
                }, 100); // Reduced delay - TerraDraw is ready now
              });

              // Start TerraDraw after all event listeners are set up
              draw.start();
              console.log('✅ TerraDraw started successfully');
              
            } catch (error) {
              console.error('❌ Error initializing TerraDraw:', error);
              // Try to initialize TerraDraw again after a delay
              setTimeout(() => {
                console.log('Retrying TerraDraw initialization...');
                try {
                  const retryDraw = new TerraDraw({
                    adapter: new TerraDrawGoogleMapsAdapter({ map, lib: google.maps, coordinatePrecision: 9 }),
                    modes: [
                      new TerraDrawSelectMode({
                        flags: {
                          polygon: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                          linestring: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                          point: { feature: { draggable: true, rotateable: true } },
                          rectangle: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                          circle: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                          freehand: { feature: { draggable: true, rotateable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
                        },
                      }),
                      new TerraDrawPolygonMode({
                        editable: true,
                        styles: (() => {
                          const color = getRandomColor();
                          return { fillColor: color, outlineColor: color };
                        })(),
                      }),
                    ],
                  });

                  drawRef.current = retryDraw;
                  retryDraw.on("ready", () => {
                    retryDraw.setMode("select");
                    setTerraDrawInitialized(true);
                    console.log('✅ TerraDraw retry initialization successful');
                  });
                  retryDraw.start();
                } catch (retryError) {
                  console.error('❌ TerraDraw retry initialization failed:', retryError);
                }
              }, 2000);
            }
          }, 200); // Add delay to ensure DOM is ready
        });
      }
    });


    // Keyboard event for rotate
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" && selectedFeatureIdRef.current && drawRef.current) {
        const features = drawRef.current.getSnapshot();
        const selectedFeature = features.find(f => f.id === selectedFeatureIdRef.current);
        if (
          selectedFeature &&
          selectedFeature.geometry.type === "Polygon" &&
          Array.isArray(selectedFeature.geometry.coordinates) &&
          Array.isArray(selectedFeature.geometry.coordinates[0])
        ) {
          const newFeature = rotateFeature(selectedFeature, 15);
          drawRef.current.addFeatures([newFeature]);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Clean up TerraDraw instance
      if (drawRef.current) {
        try {
          drawRef.current.stop();
        } catch (error) {
          // Error stopping TerraDraw - continue cleanup
        }
        drawRef.current = null;
      }
      // Clean up markers
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = [];
      
      // Clean up InfoWindow
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, []);

  // UI handlers
  const handleModeChange = (modeName: string, buttonId: string) => {
    if (!drawRef.current) return;
    if (modeName === "static") {
      drawRef.current.clear();
      drawRef.current.setMode("static");
    } else {
      drawRef.current.setMode(modeName);
    }
    setActiveButton(buttonId);
  };

  const setActiveButton = (buttonId: string) => {
    const buttons = document.querySelectorAll(".mode-button");
    const resizeButton = document.getElementById("resize-button");
    const isResizeActive = resizeButton?.classList.contains("active");
    
    buttons.forEach(button => {
      if (button.id !== "resize-button") {
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
      }
    });
    
    const activeButton = document.getElementById(buttonId);
    if (activeButton) {
      activeButton.classList.add("active");
      activeButton.setAttribute("aria-pressed", "true");
    }
    
    if (isResizeActive) {
      resizeButton?.classList.add("active");
      resizeButton?.setAttribute("aria-pressed", "true");
    }
  };

  const handleExport = () => {
    if (!drawRef.current) return;
    const features = drawRef.current.getSnapshot();
    const geojson = { type: "FeatureCollection", features };
    const data = JSON.stringify(geojson, null, 2);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing.geojson";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!drawRef.current) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const geojson = JSON.parse(e.target?.result as string);
          if (geojson.type === "FeatureCollection") {
            drawRef.current!.addFeatures(geojson.features);
          } else {
            alert("Invalid GeoJSON file: must be a FeatureCollection.");
          }
        } catch {
          alert("Error parsing GeoJSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResize = () => {
    resizingEnabledRef.current = !resizingEnabledRef.current;
    const resizeButton = document.getElementById("resize-button");
    resizeButton?.classList.toggle("active", resizingEnabledRef.current);
    resizeButton?.setAttribute("aria-pressed", resizingEnabledRef.current.toString());
    
    if (!drawRef.current) return;
    const flags = {
      polygon: { feature: { draggable: true, coordinates: { resizable: resizingEnabledRef.current ? "center" : undefined, draggable: !resizingEnabledRef.current } } },
      linestring: { feature: { draggable: true, coordinates: { resizable: resizingEnabledRef.current ? "center" : undefined, draggable: !resizingEnabledRef.current } } },
      rectangle: { feature: { draggable: true, coordinates: { resizable: resizingEnabledRef.current ? "center" : undefined, draggable: !resizingEnabledRef.current } } },
      circle: { feature: { draggable: true, coordinates: { resizable: resizingEnabledRef.current ? "center" : undefined, draggable: !resizingEnabledRef.current } } },
      freehand: { feature: { draggable: true, coordinates: { resizable: resizingEnabledRef.current ? "center" : undefined, draggable: !resizingEnabledRef.current } } },
    };
    drawRef.current.updateModeOptions("select", { flags });
  };

  const handleDeleteSelected = () => {
    if (!drawRef.current) return;
    if (selectedFeatureIdRef.current) {
      deletePolygon(selectedFeatureIdRef.current);
      selectedFeatureIdRef.current = null;
    } else {
      const features = drawRef.current.getSnapshot();
      if (features.length > 0) {
        const lastFeature = features[features.length - 1];
        if (lastFeature.id) {
          deletePolygon(String(lastFeature.id));
        }
      }
    }
  };

  const handleUndo = () => {
    if (historyRef.current.length > 1 && drawRef.current) {
      redoHistoryRef.current.push(historyRef.current.pop());
      const snapshotToRestore = historyRef.current[historyRef.current.length - 1];
      isRestoringRef.current = true;
      drawRef.current.clear();
      drawRef.current.addFeatures(snapshotToRestore);
      setTimeout(() => { isRestoringRef.current = false; }, 0);
    }
  };

  const handleRedo = () => {
    if (redoHistoryRef.current.length > 0 && drawRef.current) {
      const snapshot = redoHistoryRef.current.pop();
      historyRef.current.push(snapshot);
      isRestoringRef.current = true;
      drawRef.current.clear();
      drawRef.current.addFeatures(snapshot);
      setTimeout(() => { isRestoringRef.current = false; }, 0);
    }
  };

  return (
    <div 
      style={{ 
        width: isFullscreen ? "100vw" : "100%", 
        height: isFullscreen ? "100vh" : dynamicHeight.containerHeight,
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? "0" : "auto",
        left: isFullscreen ? "0" : "auto",
        zIndex: isFullscreen ? "9999" : "auto",
        backgroundColor: isFullscreen ? "#000" : "transparent"
      }} 
      role="main" 
      aria-label="Land Drawing Tools"
    >
      {/* Show authentication/loading/error messages */}
      {!isAuthenticated && (
        <div 
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            background: "rgba(255,0,0,0.8)", 
            color: "white", 
            padding: "20px", 
            borderRadius: "8px",
            zIndex: 1000
          }}
          role="status"
          aria-live="polite"
          aria-label="Authentication status"
        >
{t('maps.authenticationRequired')}
        </div>
      )}
      
      {isAuthenticated && landsLoading && (
        <div 
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            background: "rgba(0,0,0,0.8)", 
            color: "white", 
            padding: "20px", 
            borderRadius: "8px",
            zIndex: 1000
          }}
          role="status"
          aria-live="polite"
          aria-label="Loading status"
        >
{t('maps.loadingLands')}
        </div>
      )}
      
      {isAuthenticated && landsError && (
        <div 
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            background: "rgba(255,0,0,0.8)", 
            color: "white", 
            padding: "20px", 
            borderRadius: "8px",
            zIndex: 1000
          }}
          role="status"
          aria-live="polite"
          aria-label="Error status"
        >
{t('maps.errorLoadingLands')}: {landsError.message}
        </div>
      )}
      
      {isAuthenticated && !landsLoading && !landsError && !lands && (
        <div 
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            background: "rgba(0,0,0,0.8)", 
            color: "white", 
            padding: "20px", 
            borderRadius: "8px",
            zIndex: 1000
          }}
          role="status"
          aria-live="polite"
          aria-label="No data status"
        >
{t('maps.noLandsData')}
        </div>
      )}
      
      {/* Show TerraDraw loading message */}
      {lands && !terraDrawInitialized && (
        <div 
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            background: "rgba(0,0,0,0.8)", 
            color: "white", 
            padding: "20px", 
            borderRadius: "8px",
            zIndex: 1000
          }}
          role="status"
          aria-live="polite"
          aria-label="Initialization status"
        >
{t('maps.initializingTools')}
        </div>
      )}

      {/* Fullscreen mode indicator */}
      {isFullscreen && (
        <div 
          style={{ 
            position: "absolute", 
            top: "10px", 
            right: "10px", 
            background: "rgba(0,0,0,0.7)", 
            color: "white", 
            padding: "8px 12px", 
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>{t('maps.fullscreenMode')}</span>
          <span style={{ fontSize: "10px", opacity: 0.7 }}>{t('maps.pressEscToExit')}</span>
        </div>
      )}

      
      {/* <div id="mode-ui">
        <button id="select-mode" className="mode-button" onClick={() => handleModeChange("select", "select-mode")}>Select</button>
        <button id="point-mode" className="mode-button" onClick={() => handleModeChange("point", "point-mode")}>Point</button>
        <button id="linestring-mode" className="mode-button" onClick={() => handleModeChange("linestring", "linestring-mode")}>LineString</button>
        <button id="polygon-mode" className="mode-button" onClick={() => handleModeChange("polygon", "polygon-mode")}>Polygon</button>
        <button id="rectangle-mode" className="mode-button" onClick={() => handleModeChange("rectangle", "rectangle-mode")}>Rectangle</button>
        <button id="circle-mode" className="mode-button" onClick={() => handleModeChange("circle", "circle-mode")}>Circle</button>
        <button id="freehand-mode" className="mode-button" onClick={() => handleModeChange("freehand", "freehand-mode")}>Freehand</button>
        <button id="clear-mode" className="mode-button" onClick={() => handleModeChange("static", "clear-mode")}>Clear</button>
        <button id="resize-button" className="mode-button" onClick={handleResize}>Resize</button>
      </div>
      <div>
        <button id="export-button" onClick={handleExport}>Export</button>
        <button id="upload-button" onClick={() => document.getElementById("upload-input")?.click()}>Upload</button>
        <input id="upload-input" type="file" style={{ display: "none" }} onChange={handleUpload} />
        <button id="delete-selected-button" onClick={handleDeleteSelected}>Delete Selected</button>
        <button id="undo-button" onClick={handleUndo}>Undo</button>
        <button id="redo-button" onClick={handleRedo}>Redo</button>
      </div> */}
      <div id="mode-ui" role="toolbar" aria-label="Drawing tools toolbar" aria-orientation="horizontal">
        {/* Drawing tools - only visible to admin and contributor roles */}
        {canManageLands() && (
          <>
            {/* <button id="point-mode" className="mode-button" title="Point" onClick={() => handleModeChange("point", "point-mode")}><img src="./img/point.svg" alt="Point" draggable="false" /></button> */}
            {/* <button id="linestring-mode" className="mode-button" title="Linestring" onClick={() => handleModeChange("linestring", "linestring-mode")}><img src="./img/polyline.svg" alt="Linestring" draggable="false" /></button> */}
            <button 
              id="polygon-mode" 
              className="mode-button" 
              title={t('maps.drawPolygon')} 
              aria-label={t('maps.drawPolygonTooltip')}
              aria-pressed="false"
              onClick={() => handleModeChange("polygon", "polygon-mode")}
            >
              <img src="./img/polygon.png" alt="Polygon" draggable="false" />
            </button>
            {/* <button id="rectangle-mode" className="mode-button" title="Rectangle" onClick={() => handleModeChange("rectangle", "rectangle-mode")}><img src="./img/rectangle.svg" alt="Rectangle" draggable="false" /></button> */}
            {/* <button id="circle-mode" className="mode-button" title="Circle" onClick={() => handleModeChange("circle", "circle-mode")}><img src="./img/circle.svg" alt="Circle" draggable="false" /></button> */}
            {/* <button id="freehand-mode" className="mode-button" title="Freehand" onClick={() => handleModeChange("freehand", "freehand-mode")}><img src="./img/freehand.svg" alt="Freehand" draggable="false" /></button> */}
            <button 
              id="resize-button" 
              className="mode-button" 
              title={t('maps.toggleResizeMode')} 
              aria-label={t('maps.toggleResizeModeTooltip')}
              aria-pressed="false"
              onClick={handleResize}
            >
              <img src="./img/resize.svg" alt="Resize" draggable="false" />
            </button>
            {/* <button id="clear-mode" className="mode-button" title="Clear" onClick={() => handleModeChange("static", "clear-mode")}><img src="./img/delete.svg" alt="Clear" draggable="false" /></button> */}
            <button 
              id="delete-selected-button" 
              className="mode-button" 
              title={t('maps.deleteSelected')} 
              aria-label={t('maps.deleteSelectedTooltip')}
              onClick={handleDeleteSelected}
            >
              <img src="./img/delete-selected.svg" alt="Delete Selected" draggable="false" />
            </button>
          </>
        )}
        
        {/* Select mode - available to all authenticated users */}
        <button 
          id="select-mode" 
          className="mode-button active" 
          title="Select and edit" 
          aria-label="Select mode - Click to select and edit existing shapes"
          aria-pressed="true"
          onClick={() => handleModeChange("select", "select-mode")}
        >
          <img src="./img/select.svg" alt="Select" draggable="false" />
        </button>
        <button 
          id="undo-button" 
          className="mode-button" 
          title="Undo last action" 
          aria-label="Undo - Reverse the last drawing action"
          onClick={handleUndo}
        >
          <img src="./img/undo.svg" alt="Undo" draggable="false" />
        </button>
        <button 
          id="redo-button" 
          className="mode-button" 
          title="Redo last undone action" 
          aria-label="Redo - Restore the last undone action"
          onClick={handleRedo}
        >
          <img src="./img/redo.svg" alt="Redo" draggable="false" />
        </button>
        <button 
          id="export-button" 
          className="mode-button" 
          title="Export drawing as GeoJSON" 
          aria-label="Export drawing - Download the current drawing as a GeoJSON file"
          onClick={handleExport}
        >
          <img src="./img/download.svg" alt="Export" draggable="false" />
        </button>
        <button 
          id="upload-button" 
          className="mode-button" 
          title="Upload GeoJSON file" 
          aria-label="Upload GeoJSON - Import a GeoJSON file to add shapes to the map"
          onClick={() => document.getElementById("upload-input")?.click()}
        >
          <img src="./img/upload.svg" alt="Upload" draggable="false" />
        </button>
        <button 
          id="toggle-markers-button" 
          className="mode-button" 
          title={showMarkers ? "Hide land code markers" : "Show land code markers"} 
          aria-label={showMarkers ? "Hide markers - Hide land code markers on the map" : "Show markers - Display land code markers on the map"}
          aria-pressed={showMarkers}
          onClick={toggleMarkers}
        >
          <span style={{ color: showMarkers ? "#4285F4" : "#666", fontWeight: "bold", fontSize: "12px" }}>M</span>
        </button>
        <button 
          id="toggle-colors-button" 
          className="mode-button" 
          title={showColorsLegend ? "Hide color legend" : "Show color legend"} 
          aria-label={showColorsLegend ? "Hide legend - Hide plant type color legend" : "Show legend - Display plant type color legend"}
          aria-pressed={showColorsLegend}
          onClick={toggleColorsLegend}
        >
          <span style={{ color: showColorsLegend ? "#4285F4" : "#666", fontWeight: "bold", fontSize: "12px" }}>🎨</span>
        </button>
        <button 
          id="toggle-fullscreen-button" 
          className="mode-button" 
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} 
          aria-label={isFullscreen ? "Exit fullscreen - Return to normal view" : "Enter fullscreen - View map in fullscreen mode"}
          aria-pressed={isFullscreen}
          onClick={toggleFullscreen}
        >
          <span style={{ color: isFullscreen ? "#4285F4" : "#666", fontWeight: "bold", fontSize: "12px" }}>⛶</span>
        </button>
        <button 
          id="refresh-lands-button" 
          className="mode-button" 
          title="Refresh lands data" 
          aria-label="Refresh lands data - Reload land data from backend"
          onClick={refreshLandsData}
        >
          <span style={{ color: "#4285F4", fontWeight: "bold", fontSize: "12px" }}>↻</span>
        </button>
        <button 
          id="reload-polygons-button" 
          className="mode-button" 
          title="Reload polygons on map" 
          aria-label="Reload polygons - Force reload polygons on the map"
          onClick={reloadPolygons}
        >
          <span style={{ color: "#34A853", fontWeight: "bold", fontSize: "12px" }}>🔄</span>
        </button>

        <input 
          id="upload-input" 
          type="file" 
          style={{ display: "none" }} 
          accept=".geojson,.json" 
          onChange={handleUpload}
          aria-label="Upload GeoJSON file"
        />
      </div>
      <div 
        id="map1" 
        ref={mapRef} 
        style={{ 
          width: "100%", 
          height: isFullscreen ? "100vh" : dynamicHeight.mapHeight,
          minHeight: isFullscreen ? "100vh" : "400px",
          position: "relative"
        }} 
        role="application"
        aria-label="Interactive map for drawing land boundaries"
        tabIndex={0}
      />

      {/* Notification Markers for High Priority Notifications */}
      <NotificationMarkersManager 
        map={mapInstanceRef.current} 
        onNotificationClick={(notification) => {
          console.log('Notification clicked:', notification);
          // You can add additional logic here, like opening a dialog or navigating to the notification
        }}
        onNotificationDismissed={onNotificationDismissed}
      />

      {/* Category Colors Legend */}
      {showColorsLegend && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "white",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          maxWidth: "250px"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#374151" }}>
            Category Colors
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            {/* Show categories from actual land data */}
            {lands && Array.from(new Set(lands.map(land => land.category_name))).map((categoryName, index) => {
              const sampleLand = lands.find(land => land.category_name === categoryName);
              return (
                <div key={categoryName || index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div 
                    style={{ 
                      width: "16px", 
                      height: "16px", 
                      backgroundColor: sampleLand?.category_color || '#4285F4', 
                      borderRadius: "50%",
                      border: "1px solid #ccc"
                    }} 
                  />
                  <span style={{ color: "#374151", fontSize: "10px" }}>
                    {getTranslatedCategory(t, categoryName || 'Unknown', (sampleLand as any)?.category_translation_key)}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "8px", fontSize: "10px", color: "#6B7280" }}>
            Colors from database categories. Falls back to blue for unmatched items.
          </div>
        </div>
      )}
      
      
      <MyFormDialog 
        open={open} 
        setOpen={(newOpen) => {
          setOpen(newOpen);
          // If dialog is being closed, refresh lands data to get any new lands
          if (!newOpen) {
            console.log('Form dialog closed, refreshing lands data...');
            refreshLandsData();
          }
        }} 
        polygonPaths={polygonPaths} 
        polygonArea={polygonArea}
        createItem={createItem}
        isFullscreen={isFullscreen}
      />
      
      <CreateNotificationDialog 
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
        selectedLand={selectedLandForNotification}
        onNotificationCreated={() => {
          // Refresh notifications or show success message
          console.log('Notification created successfully');
        }}
      />
      
      {/* Token Expiration Monitor - Only show in development */}
      {/* {import.meta.env.DEV && <TokenExpirationMonitor />} */}
      
      {/* Polygon Debugger - Only show in development */}
      {/* {import.meta.env.DEV && (
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000 }}>
          <PolygonDebugger 
            drawRef={drawRef} 
            terraDrawInitialized={terraDrawInitialized} 
          />
        </div>
      )} */}
    </div>
    
  );
};

export default TerraDrawingTools;
