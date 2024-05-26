import React from 'react';
import { createRoot } from 'react-dom/client';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import './styles.css';
import Direction from './direction';

const App = () => (
  <APIProvider apiKey={'AIzaSyABxeYxcj3PAnRea2CPvAXXvr2h0iBpyS4'} onLoad={() => console.log('Maps API has loaded.')}>
    <div id="map-container">
      <Map
        defaultZoom={13}
        defaultCenter={{ lat: 12.9294916, lng: 74.9173533 }}
        mapId='1a3c1948924e8100'
      >
        <Direction />
      </Map>
    </div>
  </APIProvider>
);

const root = createRoot(document.getElementById('app'));
root.render(<App />);

export default App;
