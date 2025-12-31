// Overlay entry point - React entry for region selection overlay window

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RegionOverlay } from './components/region-overlay';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RegionOverlay />
  </React.StrictMode>
);
