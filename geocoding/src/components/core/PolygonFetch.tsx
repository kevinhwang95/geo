import React, { useState } from 'react';
import { GoogleMap, useLoadScript, Polygon } from '@react-google-maps/api';
//import {MyFormDialog} from "@/components/core/my-form-dialog";
import { useGenericCrud } from '@/hooks/useGenericCrud';
import type LandRegistry from '@/types/landRegistry.type';
import type {GeoJsonPolygon} from '@/types/landRegistry.type';
import {MyFormDialogLoad} from './my-form-dialog-load';

const MapWithPolygonFetch: React.FC = () => {
  // const overlayRef = useRef<google.maps.OverlayView | null>(null);
  // const divRef = useRef<HTMLDivElement | null>(null);
  //const [map, setMap] = useState<google.maps.Map | null>(null);
  const { data: lands, error, loading } = useGenericCrud<LandRegistry>('lands');
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY'
  });
  const [showInfo, setShowInfo] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  if (loading) return <div>data is Loading...</div>;
  if (error) return <div>Error loading lands</div>;


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
      center={{ lat: 14.09480,lng: 99.82120 }} // suphanburi house
      //center={{ lat: 13.87934,lng: 100.28994 }} //chisa
      //onLoad={mapInstance => setMap(mapInstance)}
      zoom={18}
      options={mapOptions}
    >
      {lands?.map((land) => {
        if (!land.coordinations) return null;
        try {
          const geojson: GeoJsonPolygon = JSON.parse(land.coordinations);
          if (
            geojson &&
            geojson.geometry &&
            Array.isArray(geojson.geometry.coordinates) &&
            Array.isArray(geojson.geometry.coordinates[0])
          ) {
            const paths: google.maps.LatLngLiteral[] = geojson.geometry.coordinates[0]
              .filter((coord): coord is [number, number] => Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
              .map(([lng, lat]) => ({ lat, lng }));

        // Helper function to determine color based on planttypeid
        const getColor = (planttypeid: number | string) => {
          const id = Number(planttypeid);
          switch (id) {
            case 1:
              return 'red';
            case 2:
              return 'blue';
            default:
              return 'green';
          }
        };

        return (
            <React.Fragment key={land.id}>
              <Polygon
              paths={paths}
              options={{
                fillColor: getColor(land.planttypeid),
                strokeColor: getColor(land.planttypeid),
                strokeWeight: 2,
                fillOpacity: 0.25,
              }}
              onClick={() => {setShowInfo(land.id); setOpen(true);}}
              />
              {showInfo === land.id && (
              <MyFormDialogLoad open={open} setOpen={setOpen} land={land} />
              )}
            </React.Fragment>
        );
          }
        } catch (e) {
          console.warn('Invalid polygon data', e);
        }
        return null;
      })}
    </GoogleMap>
    </>
  );
};

export default MapWithPolygonFetch;
