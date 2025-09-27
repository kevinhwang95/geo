import React, { useEffect } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { TerraDraw, TerraDrawPolygonMode } from "terra-draw";
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter";

const DrawingMap: React.FC = () => {
  const map = useMap("map"); // Get the map instance by its ID

  useEffect(() => {
    if (!map) {
      return; // Ensure the map is loaded before proceeding
    }

    // Initialize the TerraDraw Google Maps Adapter
    const adapter = new TerraDrawGoogleMapsAdapter({
      map,
      lib: google.maps, // Pass the google.maps library
    });

    // Create a TerraDraw instance with the adapter and desired drawing modes
    const terraDraw = new TerraDraw({
      adapter,
      modes: [new TerraDrawPolygonMode()], // Example: Enable polygon drawing
    });

    // Start TerraDraw and set the initial drawing mode
    terraDraw.start();
    terraDraw.setMode("polygon");

    // Listen for drawing changes (e.g., when a polygon is completed)
    terraDraw.on("change", (features) => {
      console.log("Drawn Features:", features);
      // Process the GeoJSON features here (e.g., save to state, send to server)
    });

    // Cleanup function for when the component unmounts
    return () => {
      terraDraw.stop();
    };
  }, [map]); // Re-run effect if the map instance changes

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <Map id="map" defaultCenter={{ lat: 34.052235, lng: -118.243683 }} defaultZoom={10} />
    </div>
  );
};

export default DrawingMap;