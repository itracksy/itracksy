import React from 'react';
import { createRoot } from 'react-dom/client';
import NotificationApp from './NotificationApp';

const container = document.getElementById('notification-root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <NotificationApp />
  </React.StrictMode>
);
