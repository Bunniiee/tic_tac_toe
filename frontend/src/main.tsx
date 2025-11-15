/**
 * Main entry point for the React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Temporarily removed StrictMode to debug UI update issues
  // In development, StrictMode causes double renders which might interfere with state updates
  <App />
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,
);

