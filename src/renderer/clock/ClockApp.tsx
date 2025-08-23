import React, { useState, useEffect, useCallback } from "react";

interface TimeEntry {
  id: string;
  isFocusMode: boolean;
  startTime: number;
  endTime?: number;
  targetDuration: number;
  description: string;
}

interface FocusTarget {
  id: string;
  userId: string;
  targetMinutes: number;
  enableReminders: boolean;
  reminderIntervalMinutes: number;
  createdAt: number;
  updatedAt: number;
}

interface DailyProgress {
  targetMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  remainingMinutes: number;
  isCompleted: boolean;
  sessionsToday: number;
}

interface ClockState {
  activeEntry: TimeEntry | null;
  currentTime: number;
  isRunning: boolean;
  focusTarget: FocusTarget | null;
  dailyProgress: DailyProgress | null;
}

const ClockApp: React.FC = () => {
  const [clockState, setClockState] = useState<ClockState>({
    activeEntry: null,
    currentTime: Date.now(),
    isRunning: false,
    focusTarget: null,
    dailyProgress: null,
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
    const electronClock = (window as any).electronClock;

    if (electronClock) {
      const handleUpdate = (data: any) => {
        setClockState((prev) => ({
          ...prev,
          activeEntry: data.activeEntry,
          isRunning: !!data.activeEntry && !data.activeEntry.endTime,
          focusTarget: data.focusTarget || prev.focusTarget,
          dailyProgress: data.dailyProgress || prev.dailyProgress,
        }));
      };

      electronClock.onUpdate(handleUpdate);

      return () => {
        electronClock.removeAllListeners();
      };
    }
  }, []);

  const handleHide = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if ((window as any).electronClock) {
      try {
        await (window as any).electronClock.hide();
      } catch (error) {
        console.error("Failed to hide clock:", error);
      }
    }
  }, []);

  const handleShowMain = useCallback(async (event: React.MouseEvent) => {
    // Don't trigger if clicking on the close button
    if ((event.target as HTMLElement).closest(".close-btn")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if ((window as any).electronClock) {
      try {
        await (window as any).electronClock.showMain();
      } catch (error) {
        console.error("Failed to show main window:", error);
      }
    }
  }, []);

  const handleContainerClick = useCallback(
    (event: React.MouseEvent) => {
      handleShowMain(event);
    },
    [handleShowMain]
  );

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getRemainingTime = (): number => {
    if (!clockState.activeEntry || clockState.activeEntry.endTime) return 0;
    const elapsed = Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);

    // Handle unlimited sessions (targetDuration = 0)
    if (clockState.activeEntry.targetDuration === 0) {
      return elapsed; // Show elapsed time instead of remaining time
    }

    const target = clockState.activeEntry.targetDuration * 60; // Convert to seconds
    return Math.max(target - elapsed, 0);
  };

  const getProgress = (): number => {
    if (!clockState.activeEntry) return 0;

    // For unlimited sessions, don't show progress bar
    if (clockState.activeEntry.targetDuration === 0) {
      return 0;
    }

    const elapsed = Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);
    const target = clockState.activeEntry.targetDuration * 60; // Convert to seconds
    return Math.min((elapsed / target) * 100, 100);
  };

  const isOvertime = (): boolean => {
    if (!clockState.activeEntry) return false;

    // Unlimited sessions are never overtime
    if (clockState.activeEntry.targetDuration === 0) {
      return false;
    }

    const elapsed = Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);
    const target = clockState.activeEntry.targetDuration * 60;
    return elapsed > target;
  };

  const isUnlimitedSession = (): boolean => {
    return clockState.activeEntry?.targetDuration === 0;
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  const { activeEntry, isRunning, focusTarget, dailyProgress } = clockState;
  const remainingTime = getRemainingTime();
  const progress = getProgress();

  if (!activeEntry || activeEntry.endTime) {
    // Idle state - show daily target and progress
    const hasTarget = focusTarget && dailyProgress;
    const dailyProgressPercent = dailyProgress?.progressPercentage || 0;

    return (
      <div
        className="clock-container idle"
        onClick={handleContainerClick}
        title="Click to open iTracksy"
      >
        <div className="clock-content">
          {hasTarget ? (
            <>
              <div className="clock-target">
                <span className="clock-title">Target</span>
                <span className="target-icon">🎯</span>
                <span className="target-text">{formatMinutes(focusTarget.targetMinutes)}</span>
              </div>
              <div className="clock-daily-progress">
                <div className="progress-info">
                  <span className="progress-text">
                    {formatMinutes(dailyProgress.completedMinutes)} /{" "}
                    {formatMinutes(dailyProgress.targetMinutes)}
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(dailyProgressPercent, 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="clock-icon">⏱️</span>
              <span className="clock-status">Ready</span>
            </>
          )}
        </div>
        <button className="close-btn" onClick={handleHide} title="Hide">
          ✕
        </button>
      </div>
    );
  }

  // Active session state
  const mode = activeEntry.isFocusMode ? "focus" : "break";
  const modeIcon = activeEntry.isFocusMode ? "🎯" : "☕";
  const unlimited = isUnlimitedSession();

  return (
    <div
      className={`clock-container active ${mode} ${unlimited ? "unlimited" : ""}`}
      onClick={handleContainerClick}
      title="Click to show main window"
    >
      <div className="clock-content">
        <span className="clock-icon">{modeIcon}</span>
        <div className="clock-info">
          <div className="clock-time">
            {unlimited ? (
              <>
                {formatTime(remainingTime)} <span className="unlimited-indicator">∞</span>
              </>
            ) : (
              formatTime(remainingTime)
            )}
          </div>
          {!unlimited && (
            <div className="clock-progress">
              <div className="clock-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
      <button className="close-btn" onClick={handleHide} title="Hide">
        ✕
      </button>
    </div>
  );
};

export default ClockApp;
