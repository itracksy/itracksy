import React, { useState, useEffect, useCallback, useMemo } from "react";

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
  elapsedSeconds: number; // Add elapsed seconds from main process
  isRunning: boolean;
  focusTarget: FocusTarget | null;
  dailyProgress: DailyProgress | null;
}

const FOCUS_DEFAULT_MINUTES = 25;
const BREAK_DEFAULT_MINUTES = 5;
const PIN_ICON = {
  pinned: "📌",
  unpinned: "📍",
} as const;

const ClockApp: React.FC = () => {
  const [clockState, setClockState] = useState<ClockState>({
    activeEntry: null,
    currentTime: Date.now(),
    elapsedSeconds: 0,
    isRunning: false,
    focusTarget: null,
    dailyProgress: null,
  });
  const [isPinned, setIsPinned] = useState<boolean>(true);

  const electronClock = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return window.electronClock;
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClockState((prev) => ({ ...prev, currentTime: Date.now() }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshWindowState = useCallback(async () => {
    if (!electronClock?.getState) {
      return;
    }

    try {
      const state = await electronClock.getState();
      setIsPinned(state.isPinned);
    } catch (error) {
      console.error("Failed to get clock window state", error);
    }
  }, [electronClock]);

  // Listen for updates from main process
  useEffect(() => {
    if (!electronClock) {
      return;
    }

    const handleUpdate = (data: any) => {
      setClockState((prev) => ({
        ...prev,
        activeEntry: data.activeEntry,
        elapsedSeconds: data.elapsedSeconds || 0,
        isRunning: !!data.activeEntry && !data.activeEntry.endTime,
        focusTarget: data.focusTarget || prev.focusTarget,
        dailyProgress: data.dailyProgress || prev.dailyProgress,
      }));
    };

    electronClock.onUpdate(handleUpdate);
    void refreshWindowState();

    return () => {
      electronClock.removeAllListeners?.();
    };
  }, [electronClock, refreshWindowState]);

  const handleHide = useCallback(async () => {
    if (!electronClock?.hide) {
      return;
    }

    try {
      await electronClock.hide();
    } catch (error) {
      console.error("Failed to hide clock:", error);
    }
  }, [electronClock]);

  const handleShowMain = useCallback(async () => {
    if (!electronClock?.showMain) {
      return;
    }
    try {
      await electronClock.showMain();
    } catch (error) {
      console.error("Failed to show main window:", error);
    }
  }, [electronClock]);

  const handleTogglePin = useCallback(async () => {
    if (!electronClock?.togglePin) {
      return;
    }

    try {
      const state = await electronClock.togglePin();
      setIsPinned(state.isPinned);
    } catch (error) {
      console.error("Failed to toggle clock pin state", error);
    }
  }, [electronClock]);

  const executeControl = useCallback(
    async (action: string, data?: unknown) => {
      if (!electronClock?.control) {
        return;
      }

      try {
        await electronClock.control(action, data);
      } catch (error) {
        console.error(`Failed to execute clock action: ${action}`, error);
      }
    },
    [electronClock]
  );

  const handleStartFocus = useCallback(() => {
    const targetMinutes = clockState.activeEntry?.targetDuration || FOCUS_DEFAULT_MINUTES;
    void executeControl("start", {
      isFocusMode: true,
      targetDuration: targetMinutes,
      description: "Focus Session",
    });
  }, [clockState.activeEntry, executeControl]);

  const handleStartBreak = useCallback(() => {
    void executeControl("start", {
      isFocusMode: false,
      targetDuration: BREAK_DEFAULT_MINUTES,
      description: "Break",
    });
  }, [executeControl]);

  const handlePause = useCallback(() => {
    void executeControl("pause");
  }, [executeControl]);

  const handleStop = useCallback(() => {
    void executeControl("stop");
  }, [executeControl]);

  const handleResume = useCallback(() => {
    const isFocusMode = clockState.activeEntry?.isFocusMode ?? true;
    const targetDuration = clockState.activeEntry?.targetDuration ?? FOCUS_DEFAULT_MINUTES;
    const description = clockState.activeEntry?.description ?? (isFocusMode ? "Focus Session" : "Break");
    void executeControl("resume", {
      isFocusMode,
      targetDuration,
      description,
    });
  }, [clockState.activeEntry, executeControl]);

  const electronAvailable = Boolean(electronClock);

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

    // Use elapsedSeconds from main process if available, otherwise calculate locally
    const elapsed =
      clockState.elapsedSeconds > 0
        ? clockState.elapsedSeconds
        : Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);

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

    // Use elapsedSeconds from main process if available, otherwise calculate locally
    const elapsed =
      clockState.elapsedSeconds > 0
        ? clockState.elapsedSeconds
        : Math.floor((clockState.currentTime - clockState.activeEntry.startTime) / 1000);
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
  const activeProgress = getProgress();

  if (!activeEntry || activeEntry.endTime) {
    // Idle state - show daily target and progress
    const hasTarget = focusTarget && dailyProgress;
    const dailyProgressPercent = dailyProgress?.progressPercentage ?? 0;

    return (
      <div className={`clock-shell idle ${isPinned ? "pinned" : "unpinned"}`}>
        <header className="clock-header no-drag">
          <div className="clock-status">
            <span className="clock-mode-icon">⏱️</span>
            <div className="clock-mode-text">
              <span className="clock-mode-label">Pomodoro Ready</span>
              <span className="clock-subtitle">
                {hasTarget
                  ? `Today: ${formatMinutes(dailyProgress?.completedMinutes || 0)} / ${formatMinutes(
                      focusTarget?.targetMinutes || FOCUS_DEFAULT_MINUTES
                    )}`
                  : "Plan your next focus sprint"}
              </span>
            </div>
          </div>
          <div className="clock-toolbar">
            <button
              type="button"
              className="icon-button no-drag"
              onClick={handleTogglePin}
              title={isPinned ? "Unpin window" : "Pin window"}
            >
              {isPinned ? PIN_ICON.pinned : PIN_ICON.unpinned}
            </button>
            <button
              type="button"
              className="icon-button no-drag"
              onClick={handleHide}
              title="Hide"
            >
              ✕
            </button>
          </div>
        </header>

        <section className="clock-body no-drag">
          {hasTarget ? (
            <div className="daily-progress-card">
              <div className="daily-progress-header">
                <span className="daily-progress-title">Today's Focus</span>
                <span className="daily-progress-percentage">{Math.round(dailyProgressPercent)}%</span>
              </div>
              <div className="daily-progress-bar">
                <div
                  className="daily-progress-fill"
                  style={{ width: `${Math.min(dailyProgressPercent, 100)}%` }}
                />
              </div>
              <div className="daily-progress-meta">
                <span>{formatMinutes(dailyProgress?.completedMinutes || 0)} completed</span>
                <span>{formatMinutes(dailyProgress?.remainingMinutes || 0)} to go</span>
              </div>
            </div>
          ) : (
            <div className="clock-ready-card">
              <span className="ready-title">Stay on track</span>
              <span className="ready-text">Launch a focus or break session from here.</span>
            </div>
          )}
        </section>

        <footer className="clock-footer no-drag">
          <div className="clock-actions primary">
            <button
              type="button"
              className="action-button primary"
              onClick={handleStartFocus}
              disabled={!electronAvailable}
            >
              Start Focus
            </button>
            <button
              type="button"
              className="action-button secondary"
              onClick={handleStartBreak}
              disabled={!electronAvailable}
            >
              Start Break
            </button>
          </div>
          <div className="clock-actions secondary">
            <button
              type="button"
              className="action-button ghost"
              onClick={handleShowMain}
              disabled={!electronAvailable}
            >
              Open iTracksy
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Active session state
  const mode = activeEntry.isFocusMode ? "focus" : "break";
  const modeIcon = activeEntry.isFocusMode ? "🎯" : "☕";
  const unlimited = isUnlimitedSession();
  const timerLabel = unlimited ? "Elapsed time" : activeEntry.isFocusMode ? "Focus remaining" : "Break remaining";
  const statusText = activeEntry.isFocusMode
    ? clockState.isRunning
      ? "Focused and flowing"
      : "Focus paused"
    : clockState.isRunning
    ? "Enjoy your break"
    : "Break paused";
  const progress = getProgress();
  const targetMinutes = activeEntry.targetDuration || (activeEntry.isFocusMode ? FOCUS_DEFAULT_MINUTES : BREAK_DEFAULT_MINUTES);

  return (
    <div className={`clock-shell active ${mode} ${isPinned ? "pinned" : "unpinned"}`}>
      <header className="clock-header no-drag">
        <div className="clock-status">
          <span className="clock-mode-icon">{modeIcon}</span>
          <div className="clock-mode-text">
            <span className="clock-mode-label">{activeEntry.isFocusMode ? "Focus Session" : "Break Session"}</span>
            <span className="clock-subtitle">{statusText}</span>
          </div>
        </div>
        <div className="clock-toolbar">
          <button
            type="button"
            className="icon-button no-drag"
            onClick={handleTogglePin}
            title={isPinned ? "Unpin window" : "Pin window"}
          >
            {isPinned ? "📌" : "📍"}
          </button>
          <button
            type="button"
            className="icon-button no-drag"
            onClick={handleHide}
            title="Hide"
          >
            ✕
          </button>
        </div>
      </header>

      <section className="clock-body no-drag">
        <div className="clock-timer-wrapper">
          <span className="clock-timer-label">{timerLabel}</span>
          <div className="clock-timer-display">
            {formatTime(remainingTime)}
            {unlimited && <span className="unlimited-indicator">∞</span>}
          </div>
        </div>
        {!unlimited && (
          <div className="clock-progress-track">
            <div className="clock-progress-meter" style={{ width: `${activeProgress}%` }} />
          </div>
        )}
        <div className="clock-meta-row">
          <span className="clock-meta-item">
            Target: {targetMinutes > 0 ? formatMinutes(targetMinutes) : "Unlimited"}
          </span>
          <span className="clock-meta-item">{clockState.isRunning ? "Running" : "Paused"}</span>
        </div>
      </section>

      <footer className="clock-footer no-drag">
        <div className="clock-actions primary">
          {clockState.isRunning ? (
            <>
              <button
                type="button"
                className="action-button primary"
                onClick={handlePause}
              >
                Pause
              </button>
              <button type="button" className="action-button secondary" onClick={handleStop}>
                Stop
              </button>
            </>
          ) : (
            <>
              <button type="button" className="action-button primary" onClick={handleResume}>
                Resume
              </button>
              <button type="button" className="action-button secondary" onClick={handleStop}>
                End Session
              </button>
            </>
          )}
        </div>
        <div className="clock-actions secondary">
          {activeEntry.isFocusMode ? (
            <button type="button" className="action-button ghost" onClick={handleStartBreak}>
              Start Break
            </button>
          ) : (
            <button type="button" className="action-button ghost" onClick={handleStartFocus}>
              Back to Focus
            </button>
          )}
          <button type="button" className="action-button ghost" onClick={handleShowMain}>
            Open iTracksy
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ClockApp;
