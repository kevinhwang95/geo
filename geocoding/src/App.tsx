import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//import { Button } from "@/components/ui/button";
//import MapWithPolygonDrawing from '@/components/core/mymapcomponent';
//import DrawingMap from '@/components/core/DrawingMap';
//import { APIProvider } from '@vis.gl/react-google-maps';
//import { LoadMap } from '@/components/core/TerraDrawingTools';
//import {LandRegistryList} from './components/core/LandRegistryList';
import MapWithPolygonFetch from '@/components/core/PolygonFetch';
//import { APIProvider, Map } from '@vis.gl/react-google-maps';
import TerraDrawingTools from '@/components/core/TerraDrawingTools';
//import TerraDrawingToolsWrapper from '@/components/core/TerraDrawingToolsWrapper';
// import CustomTextOverlay from '@/components/core/CustomTextOverlay';

function App() {
  // const apiKey = "AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY"; // Replace with your actual API key
  // const defaultCenter = { lat: 34.052235, lng: -118.243683 };
  return (
    // <>
    //   {/* <MapWithPolygonDrawing /> */}
    //   {/* <APIProvider apiKey={apiKey}> */}
    //       {/* <Map defaultCenter={defaultCenter} defaultZoom={10}>
    //         <CustomTextOverlay position={defaultCenter} text="Hello, Google Maps!" />
    //       </Map> */}
    //     {/* </APIProvider> */}
    //     <MapWithPolygonFetch />
    //   {/* <TerraDrawingTools /> */}
    //   {/* <APIProvider apiKey="AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY">
    //     <DrawingMap />
    //   </APIProvider> */}
    // </>

    <Router>
      <Routes>
        <Route path="/" element={<MapWithPolygonFetch />} />
        <Route path="/draw" element={<TerraDrawingTools />} />
      </Routes>
    </Router>
  );
}

export default App;



