import React, { useState, useEffect } from 'react';

interface NotificationData {
  title: string;
  body: string;
}

const NotificationApp: React.FC = () => {
  const [notificationData, setNotificationData] =
    useState<NotificationData | null>(null);

  useEffect(() => {
    // Listen for notification data from main process via the preload API
    if (window.electronAPI) {
      const handleNotification = (data: NotificationData) => {
        console.log('Notification received in component:', data);
        setNotificationData(data);
      };

      window.electronAPI.onNotification(handleNotification);

      // Cleanup function would be called if available
      return () => {
        // Note: we may need to add a removeListener function to the preload script
        console.log('Cleaning up notification listener');
      };
    } else {
      console.error('electronAPI not available in notification window');
    }
  }, []);

  const closeNotification = () => {
    console.log('Closing notification via electronAPI');
    if (window.electronAPI) {
      window.electronAPI.closeNotification();
    }
  };

  return (
    <div
      style={{
        padding: '15px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: 'Arial, sans-serif',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
          {notificationData?.title || 'Notification'}
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', opacity: 0.9 }}>
          {notificationData?.body || 'This is a notification window.'}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={closeNotification}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Close
          </button>

          <button
            onClick={() => {
              console.log('Notification acknowledged');
              closeNotification();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationApp;
