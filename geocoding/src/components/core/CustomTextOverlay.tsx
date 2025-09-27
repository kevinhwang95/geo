    import React, { useEffect, useRef } from 'react';
    import { useMap } from '@vis.gl/react-google-maps';

    interface CustomTextOverlayProps {
      position: google.maps.LatLngLiteral;
      text: string;
    }

    const CustomTextOverlay: React.FC<CustomTextOverlayProps> = ({ position, text }) => {
      const map = useMap();
      const overlayRef = useRef<google.maps.OverlayView | null>(null);
      const divRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        if (!map) return;

        // Create a custom OverlayView
        const overlay = new google.maps.OverlayView();
        overlayRef.current = overlay;

        overlay.onAdd = () => {
          // Create the HTML element for your text
          const div = document.createElement('div');
          divRef.current = div;
          div.style.position = 'absolute';
          div.style.background = 'none';
          div.style.padding = '5px';
          div.style.border = 'none';
          div.textContent = text;
          div.style.opacity = '0.7';
          div.style.color = 'red';
          div.style.fontSize = '16px';

          // Append to the appropriate pane
          overlay.getPanes()?.overlayLayer.appendChild(div);
        };

        overlay.draw = () => {
          if (!divRef.current) return;

          // Position the div based on the LatLng
          const proj = overlay.getProjection();
          const point = proj.fromLatLngToDivPixel(new google.maps.LatLng(position));

          if (point) {
            divRef.current.style.left = `${point.x}px`;
            divRef.current.style.top = `${point.y}px`;
          }
        };

        overlay.onRemove = () => {
          // Clean up the HTML element
          if (divRef.current) {
            divRef.current.parentNode?.removeChild(divRef.current);
            divRef.current = null;
          }
        };

        overlay.setMap(map);

        return () => {
          overlay.setMap(null); // Clean up when component unmounts
        };
      }, [map, position, text]);

      return null; // This component doesn't render directly to the DOM
    };

    export default CustomTextOverlay;