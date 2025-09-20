//import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
//import { APIProvider, Map, } from '@vis.gl/react-google-maps';
import MapWithPolygonDrawing from './components/ui/mymapcomponent';

function App() {
  const [clickedLocation, setClickedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setClickedLocation(event.latLng.toJSON());
      console.log('Map clicked at:', event.latLng.toJSON());
    }
  };
  return (
    // <APIProvider apiKey={'AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY'} onLoad={() => console.log('Maps API has loaded.')}>
    //   <div style={{ height: '100%', width: '100%' }}>
    //     <Map
    //       defaultCenter={{ lat:14.09480, lng: 99.82120 }} // Example default center (Los Angeles)
    //       defaultZoom={18}
    //       onMapClick={handleMapClick}
    //     />
    //   </div>
    //   {clickedLocation && (
    //     <div>
    //       <p>Last clicked location:</p>
    //       <p>Latitude: {clickedLocation.lat}</p>
    //       <p>Longitude: {clickedLocation.lng}</p>
    //     </div>
    //   )}
    // </APIProvider>
    <MapWithPolygonDrawing />
  )
}

export default App