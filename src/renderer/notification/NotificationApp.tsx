import {
  NotificationData,
  NotificationAction,
} from "@/helpers/notification/notification-window-utils";
import React, { useState, useEffect } from "react";

const NotificationApp: React.FC = () => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(5); // Auto-close after 5 seconds
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null); // Session countdown

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
        // Initialize session countdown if sessionEndTime is provided
        if (data.sessionEndTime) {
          const timeUntilEnd = Math.max(0, Math.floor((data.sessionEndTime - Date.now()) / 1000));
          setSessionTimeLeft(timeUntilEnd);
        } else {
          setSessionTimeLeft(null);
        }
      };

      window.electronNotification.onNotification(handleNotification);

      // Only return cleanup function when component is truly unmounting
      return () => {
        console.log("NotificationApp: Component unmounting, cleaning up listeners");
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

  // Session countdown timer
  useEffect(() => {
    if (sessionTimeLeft !== null && sessionTimeLeft > 0) {
      const timer = setTimeout(() => {
        setSessionTimeLeft(sessionTimeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [sessionTimeLeft]);

  // Add keyboard support for closing notification
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNotification();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const handleExtendSession = async (minutesToAdd: number) => {
    try {
      console.log("Extending session by", minutesToAdd, "minutes");
      if (window.electronNotification?.extendSession) {
        const result = await window.electronNotification.extendSession(minutesToAdd);
        console.log("Session extended successfully", result);

        // Update the session end time in the countdown
        if (notificationData?.sessionEndTime) {
          const newEndTime = notificationData.sessionEndTime + minutesToAdd * 60 * 1000;
          const newTimeLeft = Math.max(0, Math.floor((newEndTime - Date.now()) / 1000));
          setSessionTimeLeft(newTimeLeft);

          // Update the notification data to reflect the new end time
          setNotificationData({
            ...notificationData,
            sessionEndTime: newEndTime,
          });
        }
      } else {
        console.error("extendSession function not available");
      }
    } catch (error) {
      console.error("Failed to extend session:", error);
    }
  };
  if (!notificationData) {
    console.log("NotificationApp: No notification data, rendering placeholder");
    return null;
  }
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "transparent",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0",
        margin: "0",
        overflow: "hidden", // Prevent scrollbars
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "200px",
          padding: "20px",
          margin: "0",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: "#333",
          animation: "slideIn 0.3s ease-out",
          overflow: "hidden", // Prevent internal scrollbars
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          position: "relative", // For positioning the close button
        }}
      >
        {/* Always visible close button */}
        <button
          onClick={closeNotification}
          className="close-button"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "28px",
            height: "28px",
            background: "rgba(0, 0, 0, 0.1)",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            color: "#666",
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          title="Close notification"
        >
          ×
        </button>
        <style>
          {`
            * {
              box-sizing: border-box;
            }
            html, body {
              background: transparent !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              height: 100vh !important;
              width: 100vw !important;
            }
            #root {
              height: 100vh !important;
              width: 100vw !important;
              overflow: hidden !important;
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
            .close-button:hover {
              background: rgba(0, 0, 0, 0.2) !important;
              color: #333 !important;
              transform: scale(1.1);
            }
          `}
        </style>

        <div
          style={{
            marginBottom: "16px",
            flex: "1 1 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a1a1a",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              lineHeight: "1.4",
              flex: "0 0 auto",
              textAlign: "center",
            }}
          >
            {notificationData?.title || "Notification"}
          </h3>
          <div
            style={{
              margin: "0",
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#666",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              flex: "1 1 auto",
              overflow: "hidden",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {notificationData?.body || "This is a notification window."}
          </div>
        </div>

        {notificationData?.actions && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "8px",
              marginTop: "16px",
              flex: "0 0 auto",
              justifyContent: "center",
            }}
          >
            {notificationData.actions.map((action: NotificationAction, index: number) => {
              // Handle extend session actions specially
              if (action.label === "+ 5 minutes") {
                return (
                  <button
                    key={index}
                    onClick={() => handleExtendSession(5)}
                    style={{
                      padding: "10px 16px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      minWidth: "120px",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#218838";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#28a745";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {action.label}
                  </button>
                );
              } else if (action.label === "+ 25 minutes") {
                return (
                  <button
                    key={index}
                    onClick={() => handleExtendSession(25)}
                    style={{
                      padding: "10px 16px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      minWidth: "120px",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#0056b3";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#007bff";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {action.label}
                  </button>
                );
              } else {
                // Handle other actions normally
                return (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    style={{
                      padding: "10px 16px",
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                  >
                    {action.label}
                  </button>
                );
              }
            })}
          </div>
        )}

        {/* Show dismiss button if no actions are available */}
        {!notificationData?.actions && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "16px",
              flex: "0 0 auto",
            }}
          >
            <button
              onClick={closeNotification}
              className="action-button"
              style={{
                padding: "10px 24px",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "opacity 0.2s",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Session countdown - show if sessionEndTime is provided */}
        {sessionTimeLeft !== null && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "2px solid #e9ecef",
              flex: "0 0 auto",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#495057",
                }}
              >
                Session ends in:
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: sessionTimeLeft <= 10 ? "#dc3545" : "#198754",
                  fontFamily: "monospace",
                }}
              >
                {Math.floor(sessionTimeLeft / 60)}:
                {(sessionTimeLeft % 60).toString().padStart(2, "0")}
              </p>
              {sessionTimeLeft <= 10 && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "12px",
                    color: "#dc3545",
                    fontWeight: "500",
                  }}
                >
                  Time to wrap up!
                </p>
              )}
            </div>
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
              flex: "0 0 auto",
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
