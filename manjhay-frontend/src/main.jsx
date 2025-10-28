import React from 'react';
import { createRoot } from 'react-dom/client';
// CRITICAL: Ensure index.css is imported here
import './index.css'; 
import App from './App.jsx';

// Get the root element
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <App />
);
