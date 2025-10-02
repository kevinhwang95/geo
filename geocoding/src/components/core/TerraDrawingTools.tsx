import React, { useEffect, useRef, useState } from "react";
import {MyFormDialog} from "@/components/core/my-form-dialog";
import { Loader } from "@googlemaps/js-api-loader";
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

const TerraDrawingTools: React.FC = () => {
  

  const mapRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const historyRef = useRef<any[]>([]);
  const redoHistoryRef = useRef<any[]>([]);
  const selectedFeatureIdRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);
  const debounceTimeoutRef = useRef<number | undefined>(undefined);
  const resizingEnabledRef = useRef(false);
  const [polygonPaths, setPolygonPaths] = useState<string>("");
  const [polygonArea, setPolygonArea] = useState(0);
  const [open, setOpen] = useState(false);


  const { data: lands, deleteItem } = useGenericCrud<LandRegistry>('api/landregistry');
  
  // Note: In development mode with React StrictMode, useEffect runs twice
  // This causes the API to be called twice, which is expected behavior
  // In production builds, this won't happen

  // Track if TerraDraw has been initialized
  const [terraDrawInitialized, setTerraDrawInitialized] = useState(false);

  useEffect(() => {
    if (
      lands &&
      Array.isArray(lands) &&
      drawRef.current && // Ensure TerraDraw is initialized
      terraDrawInitialized // Ensure TerraDraw is ready
    ) {
      console.log(`Loading ${lands.length} land records into TerraDraw...`);
      
      // Clear existing features first to avoid duplicates
      drawRef.current.clear();
      
      let loadedCount = 0;
      lands.forEach((land) => {
        if (!land.coordinations) {
          console.warn(`Land ${land.id} has no coordinations data`);
          return;
        }
        
        try {
          const geojson = JSON.parse(land.coordinations);
          if (geojson.type === "Feature") {
            console.log(`Adding Feature for land ${land.id}:`, geojson.geometry?.type);
            drawRef.current!.addFeatures([geojson]);
            loadedCount++;
          } else if (
            geojson.type === "FeatureCollection" &&
            Array.isArray(geojson.features)
          ) {
            console.log(`Adding FeatureCollection for land ${land.id} with ${geojson.features.length} features`);
            drawRef.current!.addFeatures(geojson.features);
            loadedCount += geojson.features.length;
          }
        } catch (e) {
          console.error("Invalid geojson in land.coordinations", e);
        }
      });
      
      console.log(`Successfully loaded ${loadedCount} features from ${lands.length} land records`);
      
      // Verify features were loaded
      setTimeout(() => {
        if (drawRef.current) {
          const snapshot = drawRef.current.getSnapshot();
          console.log(`TerraDraw snapshot contains ${snapshot.length} features`);
        }
      }, 100);
    }
  }, [lands, terraDrawInitialized]);

  const deletePolygon = (id: string) => {
    if (drawRef.current) {
      const poly = lands!.find((land) => {
        if (!land.coordinations) return;
        try {
          const geojson = JSON.parse(land.coordinations);
          return geojson.id === id;
        } catch (e) {
          console.error("Invalid geojson in land.coordinations", e);
        }
      });
      if (poly) {
        drawRef.current.removeFeatures([id]);
        // Call API to delete from backend
        deleteItem(poly.id);
      }
    }
  };

  useEffect(() => {
    let map: google.maps.Map;

    const loader = new Loader({
      apiKey: "AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY",
      version: "weekly",
      libraries: ["maps", "drawing", "marker"],
    });

    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

      if (!mapRef.current) {
        console.error("Map container not found.");
        return;
      }
      map = new Map(mapRef.current, {
        center: { lat: 14.09480,lng: 99.82120 },
        zoom: 18,
        mapId: "c306b3c6dd3ed8d9",
        mapTypeId: "satellite",
        zoomControl: false,
        tilt: 0,
        mapTypeControl: true,
        clickableIcons: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Move all event listeners inside loader.load().then to ensure map is initialized
      if (map) {
        map.addListener("click", () => {
          if (drawRef.current) {
            console.log("Current draw mode on map click:", drawRef.current.getMode());
          }
        });

        map.addListener("projection_changed", () => {
          // Add defensive checks to prevent addEventListener error
          setTimeout(() => {
            try {
              // Check if map container still exists and is in DOM
              if (!mapRef.current) {
                console.warn("Map container not available, skipping TerraDraw initialization");
                return;
              }

              if (!document.contains(mapRef.current)) {
                console.warn("Map container not in DOM, skipping TerraDraw initialization");
                return;
              }

              // Check if map div has proper dimensions
              const mapDiv = mapRef.current;
              if (mapDiv.offsetWidth === 0 || mapDiv.offsetHeight === 0) {
                console.warn("Map container has no dimensions, skipping TerraDraw initialization");
                return;
              }

              console.log("Initializing TerraDraw...");

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
              draw.on("finish", (features, context) => {
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
                    console.log("Area:", area);
                    setPolygonArea(area/1600); // Convert to rai (1 rai = 1600 sqm)
                }
                
                console.log("Last feature:", lastFeature);
                setPolygonPaths(JSON.stringify(lastFeature));
                setOpen(true);
                // lastFeature.geometry contains the geometry of the last drawn feature

                //const feature = features.toString();
                console.log("Feature drawn:", features);
                console.log("Context:", context);
              });

              draw.on("ready", () => {
                console.log("TerraDraw is ready, setting up modes and event listeners...");
                
                draw.setMode("polygon"); // Set polygon as default mode
                historyRef.current.push(processSnapshotForUndo(draw.getSnapshot()));
                
                // Set the polygon button as active after TerraDraw is ready
                setActiveButton("polygon-mode");

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

                // Mark TerraDraw as initialized and ready to receive data
                console.log("TerraDraw initialization complete, ready to load polygon data");
                setTerraDrawInitialized(true);
              });

              // Start TerraDraw after all event listeners are set up
              draw.start();
              
            } catch (error) {
              console.error("Error initializing TerraDraw:", error);
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
          console.error("Error stopping TerraDraw:", error);
        }
        drawRef.current = null;
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
      if (button.id !== "resize-button") button.classList.remove("active");
    });
    const activeButton = document.getElementById(buttonId);
    if (activeButton) activeButton.classList.add("active");
    if (isResizeActive) resizeButton?.classList.add("active");
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
    <div style={{ width: "100%", height: "100%" }}>
      {/* Show loading message while waiting for backend data */}
      {!lands && (
        <div style={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          background: "rgba(0,0,0,0.8)", 
          color: "white", 
          padding: "20px", 
          borderRadius: "8px",
          zIndex: 1000
        }}>
          Loading polygon data from backend...
        </div>
      )}
      
      {/* Show TerraDraw loading message */}
      {lands && !terraDrawInitialized && (
        <div style={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          background: "rgba(0,0,0,0.8)", 
          color: "white", 
          padding: "20px", 
          borderRadius: "8px",
          zIndex: 1000
        }}>
          Initializing drawing tools...
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
      <div id="mode-ui">
        <button id="point-mode" className="mode-button" title="Point" onClick={() => handleModeChange("point", "point-mode")}><img src="./img/point.svg" alt="Point" draggable="false" /></button>
        <button id="linestring-mode" className="mode-button" title="Linestring" onClick={() => handleModeChange("linestring", "linestring-mode")}><img src="./img/polyline.svg" alt="Linestring" draggable="false" /></button>
        <button id="polygon-mode" className="mode-button active" title="Polygon" onClick={() => handleModeChange("polygon", "polygon-mode")}><img src="./img/polygon.png" alt="Polygon" draggable="false" /></button>
        <button id="rectangle-mode" className="mode-button" title="Rectangle" onClick={() => handleModeChange("rectangle", "rectangle-mode")}><img src="./img/rectangle.svg" alt="Rectangle" draggable="false" /></button>
        <button id="circle-mode" className="mode-button" title="Circle" onClick={() => handleModeChange("circle", "circle-mode")}><img src="./img/circle.svg" alt="Circle" draggable="false" /></button>
        <button id="freehand-mode" className="mode-button" title="Freehand" onClick={() => handleModeChange("freehand", "freehand-mode")}><img src="./img/freehand.svg" alt="Freehand" draggable="false" /></button>
        <button id="select-mode" className="mode-button" title="Select" onClick={() => handleModeChange("select", "select-mode")}><img src="./img/select.svg" alt="Select" draggable="false" /></button>
        <button id="resize-button" className="mode-button" title="Resize" onClick={handleResize}><img src="./img/resize.svg" alt="Resize" draggable="false" /></button>
        <button id="clear-mode" className="mode-button" title="Clear" onClick={() => handleModeChange("static", "clear-mode")}><img src="./img/delete.svg" alt="Clear" draggable="false" /></button>
        <button id="delete-selected-button" className="mode-button" title="Clear last or Selected" onClick={handleDeleteSelected}><img src="./img/delete-selected.svg" alt="Delete Selected" draggable="false" /></button>
        <button id="undo-button" className="mode-button" title="Undo" onClick={handleUndo}><img src="./img/undo.svg" alt="Undo" draggable="false" /></button>
        <button id="redo-button" className="mode-button" title="Redo" onClick={handleRedo}><img src="./img/redo.svg" alt="Redo" draggable="false" /></button>
        <button id="export-button" className="mode-button" title="Export" onClick={handleExport}><img src="./img/download.svg" alt="Export" draggable="false" /></button>
        <button id="upload-button" className="mode-button" title="Upload" onClick={() => document.getElementById("upload-input")?.click()}><img src="./img/upload.svg" alt="Upload" draggable="false" /></button>
        <input id="upload-input" type="file" style={{ display: "none" }} accept=".geojson,.json" onChange={handleUpload} />
      </div>
      <div id="map1" ref={mapRef} style={{ width: "100%", height: "100%" }} />
      
      <MyFormDialog open={open} setOpen={setOpen} polygonPaths={polygonPaths} polygonArea={polygonArea} />
    </div>
    
  );
};

export default TerraDrawingTools;
