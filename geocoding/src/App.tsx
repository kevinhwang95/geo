//import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import { APIProvider, Map, } from '@vis.gl/react-google-maps';

function App() {
  const [clickedLocation, setClickedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setClickedLocation(event.latLng.toJSON());
      console.log('Map clicked at:', event.latLng.toJSON());
    }
  };
  return (
    <APIProvider apiKey={'AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY'} onLoad={() => console.log('Maps API has loaded.')}>
      <div style={{ height: '500px', width: '100%' }}>
        <Map
          defaultCenter={{ lat:34, lng: -118.243683 }} // Example default center (Los Angeles)
          defaultZoom={10}
          onMapClick={handleMapClick}
        />
      </div>
      {clickedLocation && (
        <div>
          <p>Last clicked location:</p>
          <p>Latitude: {clickedLocation.lat}</p>
          <p>Longitude: {clickedLocation.lng}</p>
        </div>
      )}
    </APIProvider>
  )
}

export default App