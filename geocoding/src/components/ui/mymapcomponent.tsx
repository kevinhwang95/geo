import React, { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Polygon, DrawingManager } from '@react-google-maps/api';
import {MyFormDialog} from "@/components/ui/my-form-dialog";

const libraries: ('drawing')[] = ['drawing'];

const MapWithPolygonDrawing: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY',
    libraries,
  });

  const [polygonPaths, setPolygonPaths] = useState<google.maps.LatLngLiteral[][]>([]);
  const [polygonArea, setPolygonArea] = useState(0);
  const [open, setOpen] = useState(false);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const newPaths = polygon.getPath().getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));
    setPolygonPaths(prevPaths => [...prevPaths, newPaths]);
    const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
    setPolygonArea(area/1600);
    polygon.setMap(null); // Remove the temporary polygon drawn by DrawingManager
    setOpen(true);
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps</div>;
  const mapOptions = {
    mapTypeId: 'satellite', // Set mapTypeId to 'satellite' for satellite view
    zoomControl: true,
    gestureHandling: 'auto',
    tilt: 0, // Optional: for 45° imagery, adjust tilt
  };
    
  return (
    <>
    <GoogleMap
      mapContainerStyle={{ width: '100vw', height: '100vh' }}
      center={{ lat: 14.09480,lng: 99.82120 }}
      // center={{ lat: 13.87934,lng: 100.28994 }}
      zoom={18}
      options={mapOptions}
    >
      <DrawingManager
        drawingMode={google.maps.drawing.OverlayType.POLYGON}
        options={{
          polygonOptions: {
            fillColor: '#FF0000',
            strokeColor: '#FF0000',
            strokeWeight: 2,
            fillOpacity: 0.35,
            editable: true,
          },
        }}
        onPolygonComplete={onPolygonComplete}
      />
      {polygonPaths.map((paths, index) => (
        <Polygon key={index} paths={paths} options={{
          fillColor: '#0000FF',
          strokeColor: '#0000FF',
          strokeWeight: 2,
          fillOpacity: 0.35,
        }} />
      ))}
      {/* {polygonArea && (
        <div style={{ position: 'absolute', top: '100px', left: '10px', background: 'white', padding: '5px' }}>
          Polygon Area: {polygonArea.toFixed(2)} rais <br />
          Coordination: {polygonPaths[0].map(literal => `{lat:${literal.lat}, lng:${literal.lng}}`).join(',')}
        </div>
      )}
       */}
    </GoogleMap>
    <MyFormDialog open={open} setOpen={setOpen} polygonPaths={polygonPaths} polygonArea={polygonArea} />
    </>
  );
};

export default MapWithPolygonDrawing;
