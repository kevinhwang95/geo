import React, { useState } from 'react';
import { APIProvider, Map, InfoWindow } from '@vis.gl/react-google-maps';

function PolygonWithInfoWindow() {
  const polygonPaths = [
    { lat: 34.052235, lng: -118.243683 },
    { lat: 34.052235, lng: -118.293683 },
    { lat: 34.072235, lng: -118.293683 },
    { lat: 34.072235, lng: -118.243683 },
  ];

  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [infoWindowContent, setInfoWindowContent] = useState('');

  const handlePolygonClick = (event) => {
    setInfoWindowPosition(event.latLng.toJSON()); // Use the click location for positioning
    setInfoWindowContent('This is my polygon!');
    setShowInfoWindow(true);
  };

  const handleInfoWindowClose = () => {
    setShowInfoWindow(false);
  };

  return (
    <APIProvider apiKey="YOUR_API_KEY">
      <Map
        defaultCenter={{ lat: 34.062235, lng: -118.268683 }}
        defaultZoom={12}
      >
        <Polygon
          paths={polygonPaths}
          onClick={handlePolygonClick}
          options={{
            fillColor: '#FF0000',
            fillOpacity: 0.3,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />

        {showInfoWindow && infoWindowPosition && (
          <InfoWindow
            position={infoWindowPosition}
            onCloseClick={handleInfoWindowClose}
          >
            <div>{infoWindowContent}</div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}

export default PolygonWithInfoWindow;