import {
  NotificationData,
  NotificationAction,
} from "@/helpers/notification/notification-window-utils";
import React, { useState, useEffect } from "react";

const NotificationApp: React.FC = () => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(5); // Auto-close after 5 seconds

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

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      closeNotification();
    } catch (error) {
      console.error("Failed to execute notification action:", error);
    }
  };
  if (!notificationData) {
    return null;
  }
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
          width: "400px",
          padding: "20px",
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
            .action-button:hover {
              opacity: 0.9;
            }
          `}
        </style>

        <div style={{ marginBottom: "16px" }}>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
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
              lineHeight: "1.5",
              color: "#666",
              whiteSpace: "pre-line",
            }}
          >
            {notificationData?.body || "This is a notification window."}
          </p>
        </div>

        {notificationData?.actions && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            {notificationData.actions.map((action: NotificationAction, index: number) => (
              <button
                key={index}
                onClick={() => handleAction(action.action)}
                className="action-button"
                style={{
                  padding: "10px 16px",
                  background: index === 0 ? "#4CAF50" : index === 1 ? "#2196F3" : "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  textAlign: "left",
                  transition: "opacity 0.2s",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Auto-close countdown - only show if autoDismiss is enabled */}
        {notificationData?.autoDismiss && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <p
              style={{
                margin: "0",
                fontSize: "12px",
                color: "#999",
              }}
            >
              Auto-closing in {timeLeft}s
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationApp;
