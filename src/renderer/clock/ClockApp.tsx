import React, { useState, useEffect, useCallback } from "react";

interface TimeEntry {
  id: string;
  isFocusMode: boolean;
  startTime: number;
  endTime?: number;
  targetDuration: number;
  description: string;
}

interface ClockState {
  activeEntry: TimeEntry | null;
  currentTime: number;
  isRunning: boolean;
}

const ClockApp: React.FC = () => {
  const [clockState, setClockState] = useState<ClockState>({
    activeEntry: null,
    currentTime: Date.now(),
    isRunning: false,
  });

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClockState((prev) => ({ ...prev, currentTime: Date.now() }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for updates from main process
  useEffect(() => {
    console.log("ClockApp: Component mounted");
    console.log("ClockApp: window.electronClock available:", !!(window as any).electronClock);

    if ((window as any).electronClock) {
      const handleUpdate = (data: any) => {
        console.log("Clock update received:", data);
        setClockState((prev) => ({
          ...prev,
          activeEntry: data.activeEntry,
          isRunning: !!data.activeEntry && !data.activeEntry.endTime,
        }));
      };

      (window as any).electronClock.onUpdate(handleUpdate);

      return () => {
        (window as any).electronClock.removeAllListeners();
      };
    }
  }, []);

  const handleHide = useCallback(async () => {
    console.log("Hiding clock window");

    if ((window as any).electronClock) {
      try {
        await (window as any).electronClock.hide();
      } catch (error) {
        console.error("Failed to hide clock:", error);
      }
    }
  }, []);

  const handleShowMain = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("handleShowMain called - Showing main window");

    if ((window as any).electronClock) {
      try {
        console.log(
          "electronClock.showMain is available:",
          typeof (window as any).electronClock.showMain
        );
        await (window as any).electronClock.showMain();
        console.log("Main window show request sent successfully");
      } catch (error) {
        console.error("Failed to show main window:", error);
      }
    } else {
      console.error("electronClock is not available");
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getRemainingTime = (): number => {
    if (!clockState.activeEntry || clockState.activeEntry.endTime) return 0;
    const elapsed = Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);
    const target = clockState.activeEntry.targetDuration * 60; // Convert to seconds
    return Math.max(target - elapsed, 0);
  };

  const getProgress = (): number => {
    if (!clockState.activeEntry) return 0;
    const elapsed = Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);
    const target = clockState.activeEntry.targetDuration * 60; // Convert to seconds
    return Math.min((elapsed / target) * 100, 100);
  };

  const isOvertime = (): boolean => {
    if (!clockState.activeEntry) return false;
    const elapsed = Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);
    const target = clockState.activeEntry.targetDuration * 60;
    return elapsed > target;
  };

  const { activeEntry, isRunning } = clockState;
  const remainingTime = getRemainingTime();
  const progress = getProgress();
  const overtime = isOvertime();

  if (!activeEntry || activeEntry.endTime) {
    // Idle state
    return (
      <div className="clock-container">
        <div className="clock-header">
          <div className="clock-mode">
            <span className="clock-mode-icon">⏱️</span>
            Ready
          </div>
          <div className="clock-controls">
            <button className="control-btn" onClick={handleHide} title="Hide">
              ✕
            </button>
          </div>
        </div>

        <div
          className="clock-body"
          onClick={handleShowMain}
          onMouseEnter={() => console.log("Mouse entered clock body")}
          onMouseLeave={() => console.log("Mouse left clock body")}
          style={{ cursor: "pointer !important", userSelect: "none" }}
          title="Click to show main window"
        >
          <div className="clock-idle">Start your productivity session</div>
        </div>
      </div>
    );
  }

  // Active session state
  const mode = activeEntry.isFocusMode ? "focus" : "break";
  const modeIcon = activeEntry.isFocusMode ? "🎯" : "☕";
  const modeName = activeEntry.isFocusMode ? "Focus" : "Break";

  return (
    <div className="clock-container">
      <div className="clock-header">
        <div className={`clock-mode ${mode}`}>
          <span className="clock-mode-icon">{modeIcon}</span>
          {modeName}
        </div>
        <div className="clock-controls">
          <button className="control-btn" onClick={handleHide} title="Hide">
            ✕
          </button>
        </div>
      </div>

      <div
        className="clock-body"
        onClick={handleShowMain}
        onMouseEnter={() => console.log("Mouse entered active clock body")}
        onMouseLeave={() => console.log("Mouse left active clock body")}
        style={{ cursor: "pointer !important", userSelect: "none" }}
        title="Click to show main window"
      >
        <div
          className={`clock-time ${mode} ${isRunning ? "running" : ""} ${overtime ? "overtime" : ""}`}
        >
          {formatTime(remainingTime)}
        </div>

        <div className="clock-progress">
          <div className={`clock-progress-bar ${mode}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ClockApp;
