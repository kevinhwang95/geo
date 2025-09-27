import React, { useState } from "react";

export default function ModeUI({ drawRef, selectedFeatureId, history, redoHistory, onUndo, onRedo, onUpload, onExport }) {
  const [activeButtonId, setActiveButtonId] = useState("polygon-mode");
  const [resizingEnabled, setResizingEnabled] = useState(false);

  const clickMode = (modeName, buttonId) => {
    if (!drawRef.current) return;
    drawRef.current.setMode(modeName);
    setActiveButtonId(buttonId);
  };

  const toggleResize = () => {
    if (!drawRef.current) return;
    const newVal = !resizingEnabled;
    setResizingEnabled(newVal);

    drawRef.current.updateModeOptions('select', {
      flags: {
        polygon: { feature: { draggable: true, coordinates: { resizable: newVal ? 'center' : undefined, draggable: !newVal } } },
        linestring: { feature: { draggable: true, coordinates: { resizable: newVal ? 'center' : undefined, draggable: !newVal } } },
        rectangle: { feature: { draggable: true, coordinates: { resizable: newVal ? 'center' : undefined, draggable: !newVal } } },
        circle: { feature: { draggable: true, coordinates: { resizable: newVal ? 'center' : undefined, draggable: !newVal } } },
        freehand: { feature: { draggable: true, coordinates: { resizable: newVal ? 'center' : undefined, draggable: !newVal } } },
      }
    });

    setActiveButtonId('resize-button');
  };

  return (
    <div id="mode-ui">
      <button id="point-mode" className={`mode-button ${activeButtonId === 'point-mode' ? 'active' : ''}`} title="Point" onClick={() => clickMode('point', 'point-mode')}>
        <img src="/img/point.svg" alt="Point" draggable="false" />
      </button>

      <button id="linestring-mode" className={`mode-button ${activeButtonId === 'linestring-mode' ? 'active' : ''}`} title="Linestring" onClick={() => clickMode('linestring', 'linestring-mode')}>
        <img src="/img/polyline.svg" alt="Linestring" draggable="false" />
      </button>

      <button id="polygon-mode" className={`mode-button ${activeButtonId === 'polygon-mode' ? 'active' : ''}`} title="Polygon" onClick={() => clickMode('polygon', 'polygon-mode')}>
        <img src="/img/polygon.png" alt="Polygon" draggable="false" />
      </button>

      <button id="rectangle-mode" className={`mode-button ${activeButtonId === 'rectangle-mode' ? 'active' : ''}`} title="Rectangle" onClick={() => clickMode('rectangle', 'rectangle-mode')}>
        <img src="/img/rectangle.svg" alt="Rectangle" draggable="false" />
      </button>

      <button id="circle-mode" className={`mode-button ${activeButtonId === 'circle-mode' ? 'active' : ''}`} title="Circle" onClick={() => clickMode('circle', 'circle-mode')}>
        <img src="/img/circle.svg" alt="Circle" draggable="false" />
      </button>

      <button id="freehand-mode" className={`mode-button ${activeButtonId === 'freehand-mode' ? 'active' : ''}`} title="Freehand" onClick={() => clickMode('freehand', 'freehand-mode')}>
        <img src="/img/freehand.svg" alt="Freehand" draggable="false" />
      </button>

      <button id="select-mode" className={`mode-button ${activeButtonId === 'select-mode' ? 'active' : ''}`} title="Select" onClick={() => clickMode('select', 'select-mode')}>
        <img src="/img/select.svg" alt="Select" draggable="false" />
      </button>

      <button id="resize-button" className={`mode-button ${activeButtonId === 'resize-button' ? 'active' : ''}`} title="Resize" onClick={toggleResize}>
        <img src="/img/resize.svg" alt="Resize" draggable="false" />
      </button>

      <button id="clear-mode" className={`mode-button ${activeButtonId === 'clear-mode' ? 'active' : ''}`} title="Clear" onClick={() => {
        if (drawRef.current) {
          drawRef.current.clear();
          drawRef.current.setMode('static');
        }
        setActiveButtonId('clear-mode');
      }}>
        <img src="/img/delete.svg" alt="Clear" draggable="false" />
      </button>

      <button id="delete-selected-button" className={`mode-button ${activeButtonId === 'delete-selected-button' ? 'active' : ''}`} title="Clear last or Selected" onClick={() => {
        if (drawRef.current) {
          if (selectedFeatureId) {
            drawRef.current.removeFeatures([selectedFeatureId]);
          } else {
            const features = drawRef.current.getSnapshot();
            if (features.length > 0) {
              const last = features[features.length -1];
              if (last.id) {
                drawRef.current.removeFeatures([last.id]);
              }
            }
          }
        }
        setActiveButtonId('delete-selected-button');
      }}>
        <img src="/img/delete-selected.svg" alt="Delete Selected" draggable="false" />
      </button>

      <button id="undo-button" className={`mode-button ${activeButtonId === 'undo-button' ? 'active' : ''}`} title="Undo" disabled={history.length <=1} onClick={onUndo}>
        <img src="/img/undo.svg" alt="Undo" draggable="false" />
      </button>

      <button id="redo-button" className={`mode-button ${activeButtonId === 'redo-button' ? 'active' : ''}`} title="Redo" disabled={redoHistory.length ===0} onClick={onRedo}>
        <img src="/img/redo.svg" alt="Redo" draggable="false" />
      </button>

      <button id="export-button" className={`mode-button ${activeButtonId === 'export-button' ? 'active' : ''}`} title="Export" onClick={onExport}>
        <img src="/img/download.svg" alt="Export" draggable="false" />
      </button>

      <button id="upload-button" className={`mode-button ${activeButtonId === 'upload-button' ? 'active' : ''}`} title="Upload" onClick={() => {
        document.getElementById('upload-input').click();
        setActiveButtonId('upload-button');
      }}>
        <img src="/img/upload.svg" alt="Upload" draggable="false" />
      </button>

      <input type="file" id="upload-input" style={{ display: 'none' }} accept=".geojson,.json" onChange={onUpload} />
    </div>
  );
}