import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Timer,
  Pin,
  PinOff,
  X,
  Target,
  Coffee,
  Maximize2,
  Infinity as InfinityIcon,
} from "lucide-react";

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
  const [isMinimalView, setIsMinimalView] = useState<boolean>(false);
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(false);

  const electronClock = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return window.electronClock;
  }, []);

  // Update current time aligned to real seconds to avoid drift
  useEffect(() => {
    let timeoutId: number | undefined;

    const updateNow = () => {
      setClockState((prev) => ({ ...prev, currentTime: Date.now() }));
    };

    const scheduleNextTick = () => {
      const now = Date.now();
      const msUntilNextSecond = 1000 - (now % 1000);
      timeoutId = window.setTimeout(() => {
        updateNow();
        scheduleNextTick();
      }, msUntilNextSecond);
    };

    updateNow();
    scheduleNextTick();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactLayout(window.innerWidth < 340);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const refreshWindowState = useCallback(async () => {
    if (!electronClock?.getState) {
      return;
    }

    try {
      const state = await electronClock.getState();
      setIsPinned(state.isPinned);
      setIsMinimalView(state.sizeMode === "minimal");
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

  useEffect(() => {
    if (!clockState.activeEntry || clockState.activeEntry.endTime) {
      setIsMinimalView(false);
      void electronClock?.setSizeMode?.("detailed");
    } else {
      void electronClock?.setSizeMode?.(isMinimalView ? "minimal" : "detailed");
    }
  }, [clockState.activeEntry, electronClock, isMinimalView]);

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

  const handleToggleView = useCallback(() => {
    if (!clockState.activeEntry || clockState.activeEntry.endTime) {
      return;
    }
    setIsMinimalView((prev) => {
      const next = !prev;
      void electronClock?.setSizeMode?.(next ? "minimal" : "detailed");
      return next;
    });
  }, [clockState.activeEntry]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getElapsedSeconds = (): number => {
    const entry = clockState.activeEntry;
    if (!entry) {
      return 0;
    }

    const computedElapsed = Math.max(
      0,
      Math.floor((clockState.currentTime - entry.startTime) / 1000)
    );
    const baseElapsed = clockState.elapsedSeconds > 0 ? clockState.elapsedSeconds : computedElapsed;

    if (!clockState.isRunning) {
      if (entry.endTime) {
        return Math.max(0, Math.floor((entry.endTime - entry.startTime) / 1000));
      }
      return baseElapsed;
    }

    return computedElapsed;
  };

  const getRemainingTime = (): number => {
    if (!clockState.activeEntry || clockState.activeEntry.endTime) return 0;

    const elapsed = getElapsedSeconds();

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

    const elapsed = getElapsedSeconds();
    const target = clockState.activeEntry.targetDuration * 60; // Convert to seconds
    return Math.min((elapsed / target) * 100, 100);
  };

  const isOvertime = (): boolean => {
    if (!clockState.activeEntry) return false;

    // Unlimited sessions are never overtime
    if (clockState.activeEntry.targetDuration === 0) {
      return false;
    }

    const elapsed = getElapsedSeconds();
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
  const progressPercent = getProgress();

  if (!activeEntry || activeEntry.endTime) {
    // Idle state - show daily target and progress
    const hasTarget = focusTarget && dailyProgress;
    const dailyProgressPercent = dailyProgress?.progressPercentage ?? 0;

    return (
      <div className={`clock-shell idle ${isPinned ? "pinned" : "unpinned"}`}>
        <header className="clock-header no-drag">
          <div className="clock-status">
            <span className="clock-mode-icon">
              <Timer size={22} strokeWidth={2} />
            </span>
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
              {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
            </button>
            <button type="button" className="icon-button no-drag" onClick={handleHide} title="Hide">
              <X size={16} />
            </button>
          </div>
        </header>

        <section className="clock-body no-drag">
          {hasTarget ? (
            <div className="daily-progress-card">
              <div className="daily-progress-header">
                <span className="daily-progress-title">Today's Focus</span>
                <span className="daily-progress-percentage">
                  {Math.round(dailyProgressPercent)}%
                </span>
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

        <footer className={`clock-footer no-drag ${isCompactLayout ? "compact" : ""}`}>
          <div className="clock-actions secondary">
            <button type="button" className="action-button ghost" onClick={handleShowMain}>
              Open iTracksy
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Active session state
  const mode = activeEntry.isFocusMode ? "focus" : "break";
  const ModeIcon = activeEntry.isFocusMode ? Target : Coffee;
  const unlimited = isUnlimitedSession();
  const timerLabel = unlimited ? "Elapsed time" : activeEntry.isFocusMode ? "Focus" : "Break";
  const statusText = activeEntry.isFocusMode
    ? clockState.isRunning
      ? "Focused and flowing"
      : "Focus paused"
    : clockState.isRunning
      ? "Enjoy your break"
      : "Break paused";
  const targetMinutes =
    activeEntry.targetDuration ||
    (activeEntry.isFocusMode ? FOCUS_DEFAULT_MINUTES : BREAK_DEFAULT_MINUTES);

  return (
    <div
      className={`clock-shell active ${mode} ${isPinned ? "pinned" : "unpinned"} ${isMinimalView ? "minimal" : ""} ${isCompactLayout ? "compact" : ""}`}
    >
      {!isMinimalView && (
        <header className="clock-header no-drag">
          <div className="clock-status">
            <span className="clock-mode-icon">
              <ModeIcon size={22} strokeWidth={2} />
            </span>
            <div className="clock-mode-text">
              <span className="clock-mode-label">
                {activeEntry.isFocusMode ? "Focus" : "Break"}
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
              {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
            </button>
            <button
              type="button"
              className="icon-button no-drag"
              onClick={handleShowMain}
              title="Open iTracksy"
            >
              <Maximize2 size={16} />
            </button>
            <button type="button" className="icon-button no-drag" onClick={handleHide} title="Hide">
              <X size={16} />
            </button>
          </div>
        </header>
      )}

      <section className={`clock-body no-drag ${isMinimalView ? "minimal" : ""}`}>
        <button
          type="button"
          className={`timer-toggle ${isMinimalView ? "minimal" : ""}`}
          onClick={handleToggleView}
        >
          <div className={`clock-timer-content ${isMinimalView ? "minimal" : ""}`}>
            {isMinimalView && (
              <span className="clock-mode-icon minimal">
                <ModeIcon size={24} strokeWidth={2} />
              </span>
            )}
            <span className="clock-timer-display">
              {formatTime(remainingTime)}
              {unlimited && (
                <span className="unlimited-indicator">
                  <InfinityIcon size={24} />
                </span>
              )}
            </span>
          </div>
          {!isMinimalView && <span className="timer-hint">Click for minimal view</span>}
        </button>
        {!unlimited && !isMinimalView && (
          <div className="clock-progress-track">
            <div className="clock-progress-meter" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
        {!isMinimalView && (
          <div className="clock-meta-row">
            <span className="clock-meta-item">
              Target: {targetMinutes > 0 ? formatMinutes(targetMinutes) : "Unlimited"}
            </span>
            <span className="clock-meta-item">{clockState.isRunning ? "Running" : "Paused"}</span>
          </div>
        )}
      </section>

      {!isMinimalView && (
        <footer className={`clock-footer no-drag ${isCompactLayout ? "compact" : ""}`} />
      )}
    </div>
  );
};

export default ClockApp;
