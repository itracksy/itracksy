import React, { useState, useEffect } from "react";
import type { BlockingNotificationData } from "@/types/ipc";

const BlockingNotificationApp: React.FC = () => {
  const [notificationData, setNotificationData] = useState<BlockingNotificationData | null>(null);

  useEffect(() => {
    if (window.electronBlockingNotification) {
      const handleNotification = (data: BlockingNotificationData) => {
        setNotificationData(data);
      };

      window.electronBlockingNotification.onNotification(handleNotification);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          handleClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      // Test data for development
      setNotificationData({
        title: "Test Activity Detection",
        detail: "Blocked by rule: Social Media",
        userId: "test-user",
        timeEntryId: "test-entry",
        appOrDomain: "facebook.com",
        ruleId: "test-rule-id",
        ruleName: "Social Media",
      });
    }
  }, []);

  const handleResponse = async (response: number) => {
    if (window.electronBlockingNotification) {
      await window.electronBlockingNotification.respond(response);
    }
  };

  const handleContinueWorking = () => handleResponse(0);
  const handleReturnToFocus = () => handleResponse(1);

  const handleClose = async () => {
    if (window.electronBlockingNotification) {
      await window.electronBlockingNotification.close();
    }
  };

  const handleEditRule = async () => {
    if (window.electronBlockingNotification) {
      // Open main window with rule ID parameter to edit the specific rule
      const ruleId = notificationData?.ruleId;
      const route = ruleId ? `/rule-book?editRuleId=${ruleId}` : "/rule-book";
      await window.electronBlockingNotification.openMainWindow(route);
      // Close this notification
      await window.electronBlockingNotification.close();
    }
  };

  const handleAddException = async () => {
    if (window.electronBlockingNotification) {
      // Create a new productive rule that matches this specific activity by title
      const params = new URLSearchParams();
      params.set("createRule", "true");
      params.set("rating", "1"); // Productive

      // Set app name - always include it for proper matching
      if (notificationData?.appName) {
        params.set("appName", notificationData.appName);
      }

      // Set domain if it's a browser/website block
      if (notificationData?.domain) {
        params.set("domain", notificationData.domain);
      }

      // Set the title for matching - this creates an exception for this specific content
      if (notificationData?.title) {
        params.set("title", notificationData.title);
        params.set("titleCondition", "contains");
      }

      const route = `/rule-book?${params.toString()}`;
      await window.electronBlockingNotification.openMainWindow(route);
      // Close this notification
      await window.electronBlockingNotification.close();
    }
  };

  if (!notificationData) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="notification-card">
        {/* Close button */}
        <button className="close-btn" onClick={handleClose}>
          ×
        </button>

        {/* Header */}
        <div className="header">
          <div className="icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="title">Distraction Detected</h1>
        </div>

        {/* Activity Info */}
        <div className="activity-card">
          <div className="activity-icon">
            {notificationData.appOrDomain.includes(".") ? "🌐" : "💻"}
          </div>
          <div className="activity-info">
            <div className="activity-name">{notificationData.title}</div>
            <div className="activity-source">{notificationData.appOrDomain}</div>
          </div>
        </div>

        {/* Rule info with edit link */}
        {notificationData.ruleName && (
          <div className="rule-info">
            <span>
              Blocked by: <strong>{notificationData.ruleName}</strong>
            </span>
            <div className="rule-actions">
              <button className="edit-rule-btn" onClick={handleEditRule}>
                Edit Rule
              </button>
              <button className="add-exception-btn" onClick={handleAddException}>
                Add Exception
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          <button className="btn btn-primary" onClick={handleReturnToFocus}>
            <span className="btn-icon">🎯</span>
            <div className="btn-text">
              <span className="btn-title">Return to Focus</span>
              <span className="btn-desc">Get back to work</span>
            </div>
          </button>

          <button className="btn btn-secondary" onClick={handleContinueWorking}>
            <span className="btn-icon">✓</span>
            <div className="btn-text">
              <span className="btn-title">Allow This Time</span>
              <span className="btn-desc">It's work-related</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockingNotificationApp;
