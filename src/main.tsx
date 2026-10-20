import React from 'react';
import ReactDOM from 'react-dom/client';
import { EventDashboard } from './app/EventDashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <EventDashboard />
  </React.StrictMode>
);
