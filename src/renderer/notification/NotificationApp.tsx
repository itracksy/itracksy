import { NotificationData } from "@/helpers/notification/notification-window-utils";
import React, { useState, useEffect } from "react";

const NotificationApp: React.FC = () => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(5); // Auto-close after 5 seconds

  // Test with some initial data to verify UI works
  useEffect(() => {
    console.log("NotificationApp: Setting test data after 2 seconds");
    const testTimer = setTimeout(() => {
      if (!notificationData) {
        console.log("NotificationApp: Setting test notification data");
        setNotificationData({
          title: "Test Notification",
          body: "This is a test notification to verify the UI works",
          autoDismiss: false, // Default is no auto dismiss
        });
      }
    }, 2000);

    return () => clearTimeout(testTimer);
  }, [notificationData]);

  useEffect(() => {
    console.log("NotificationApp: Component mounted");
    console.log(
      "NotificationApp: window.electronNotification available:",
      !!window.electronNotification
    );
    console.log("NotificationApp: window object keys:", Object.keys(window));

    // Listen for notification data from main process via the preload API
    if (window.electronNotification) {
      const handleNotification = (data: NotificationData) => {
        console.log("Notification received in component:", data);
        setNotificationData(data);
        // Reset timer when new notification arrives (only if autoDismiss is enabled)
        if (data.autoDismiss) {
          setTimeLeft(5);
        }
      };

      window.electronNotification.onNotification(handleNotification);

      // Cleanup function would be called if available
      return () => {
        // Note: we may need to add a removeListener function to the preload script
        console.log("Cleaning up notification listener");
      };
    } else {
      console.error("electronNotification not available in notification window");
    }
  }, []);

  // Auto-close timer (only if autoDismiss is enabled)
  useEffect(() => {
    if (notificationData && notificationData.autoDismiss && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (notificationData && notificationData.autoDismiss && timeLeft === 0) {
      // Auto-close when timer reaches 0
      closeNotification();
    }
  }, [notificationData, timeLeft]);

  const closeNotification = async () => {
    console.log("Closing notification via electronNotification");
    if (window.electronNotification) {
      try {
        await window.electronNotification.close();
        console.log("Notification window close request completed");
      } catch (error) {
        console.error("Failed to close notification window:", error);
      }
    } else {
      console.error("electronNotification API not available");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "transparent",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        padding: "0",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "16px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: "#333",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <style>
          {`
            body {
              background: transparent !important;
              margin: 0;
              padding: 0;
            }
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}
        </style>

        <div style={{ marginBottom: "12px" }}>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1a1a1a",
            }}
          >
            {notificationData?.title || "Notification"}
          </h3>
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              lineHeight: "1.4",
              color: "#666",
            }}
          >
            {notificationData?.body || "This is a notification window."}
          </p>
        </div>

        {/* Auto-close countdown - only show if autoDismiss is enabled */}
        {notificationData && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            {notificationData.autoDismiss ? (
              <p
                style={{
                  margin: "0",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                Auto-closing in {timeLeft}s
              </p>
            ) : (
              <p
                style={{
                  margin: "0",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                Click dismiss to close
              </p>
            )}

            <button
              onClick={closeNotification}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f0f0f0",
                color: "#666",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e0e0e0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationApp;
