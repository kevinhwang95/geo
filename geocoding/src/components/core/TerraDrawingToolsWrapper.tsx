import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps'; // Adjust import path as needed
import TerraDrawingTools from '@/components/core/TerraDrawingTools'; // Adjust import path as needed

const TerraDrawingToolsWrapper: React.FC = () => {
  return (
    <APIProvider apiKey="AIzaSyBdsqAGgmfJQ3-vZhL9qPUSIVhqciANlpY">
      <TerraDrawingTools />
    </APIProvider>
  );
};

export default TerraDrawingToolsWrapper;