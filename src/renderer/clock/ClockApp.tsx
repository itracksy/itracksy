import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Pin,
  PinOff,
  X,
  Target,
  Coffee,
  Maximize2,
  Infinity as InfinityIcon,
  Sparkles,
} from "lucide-react";
import type { TimeEntry, FocusTarget, DailyProgress, ClockUpdateData } from "@/types/ipc";

interface ClockState {
  activeEntry: TimeEntry | null;
  currentTime: number;
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  pausedAt: number | null;
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
    isPaused: false,
    isManuallyPaused: false,
    pausedAt: null,
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

    const handleUpdate = (data: ClockUpdateData) => {
      setClockState((prev) => ({
        ...prev,
        activeEntry: data.activeEntry,
        elapsedSeconds: data.elapsedSeconds || 0,
        isRunning: !!data.activeEntry && !data.activeEntry.endTime && !data.isPaused,
        isPaused: data.isPaused || false,
        isManuallyPaused: data.isManuallyPaused || false,
        pausedAt: data.pausedAt || null,
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
  }, [clockState.activeEntry, electronClock]);

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

    // If paused, calculate elapsed time up to pause moment
    if (clockState.isPaused && clockState.pausedAt) {
      return Math.max(0, Math.floor((clockState.pausedAt - entry.startTime) / 1000));
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

    // Handle unlimited sessions (targetDuration = 0 or null)
    const targetDuration = clockState.activeEntry.targetDuration ?? 0;
    if (targetDuration === 0) {
      return elapsed; // Show elapsed time instead of remaining time
    }

    const target = targetDuration * 60; // Convert to seconds
    return Math.max(target - elapsed, 0);
  };

  const getProgress = (): number => {
    if (!clockState.activeEntry) return 0;

    // For unlimited sessions, don't show progress bar
    const targetDuration = clockState.activeEntry.targetDuration ?? 0;
    if (targetDuration === 0) {
      return 0;
    }

    const elapsed = getElapsedSeconds();
    const target = targetDuration * 60; // Convert to seconds
    return Math.min((elapsed / target) * 100, 100);
  };

  const isOvertime = (): boolean => {
    if (!clockState.activeEntry) return false;

    // Unlimited sessions are never overtime
    const targetDuration = clockState.activeEntry.targetDuration ?? 0;
    if (targetDuration === 0) {
      return false;
    }

    const elapsed = getElapsedSeconds();
    const target = targetDuration * 60;
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
    return `${hours}h ${mins}m`;
  };

  const { activeEntry, isRunning, focusTarget, dailyProgress } = clockState;
  const remainingTime = getRemainingTime();
  const progressPercent = getProgress();
  const overtime = isOvertime();

  // Build shell classes
  const getShellClasses = (): string => {
    const classes = ["clock-shell"];

    if (!activeEntry || activeEntry.endTime) {
      classes.push("idle");
    } else {
      classes.push("active");
      classes.push(activeEntry.isFocusMode ? "focus" : "break");
      if (overtime) classes.push("overtime");
    }

    classes.push(isPinned ? "pinned" : "unpinned");
    if (isMinimalView) classes.push("minimal");
    if (isCompactLayout) classes.push("compact");
    if (clockState.isPaused) classes.push("paused");

    return classes.join(" ");
  };

  if (!activeEntry || activeEntry.endTime) {
    // Idle state - show daily target and progress
    const hasTarget = focusTarget && dailyProgress;
    const dailyProgressPercent = dailyProgress?.progressPercentage ?? 0;

    return (
      <div className={getShellClasses()}>
        <header className="clock-header no-drag">
          <div className="clock-status">
            <span className="clock-mode-icon">
              <Sparkles size={20} strokeWidth={2} />
            </span>
            <div className="clock-mode-text">
              <span className="clock-mode-label">Ready to Focus</span>
              <span className="clock-subtitle">
                {hasTarget
                  ? `${formatMinutes(dailyProgress?.completedMinutes || 0)} of ${formatMinutes(
                      focusTarget?.targetMinutes || FOCUS_DEFAULT_MINUTES
                    )} today`
                  : "Start your next session"}
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
              {isPinned ? <Pin size={15} /> : <PinOff size={15} />}
            </button>
            <button type="button" className="icon-button no-drag" onClick={handleHide} title="Hide">
              <X size={15} />
            </button>
          </div>
        </header>

        <section className="clock-body no-drag">
          {hasTarget ? (
            <div className="daily-progress-card">
              <div className="daily-progress-header">
                <span className="daily-progress-title">Daily Progress</span>
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
                <span>{dailyProgress?.sessionsToday || 0} sessions</span>
                <span>{formatMinutes(dailyProgress?.remainingMinutes || 0)} remaining</span>
              </div>
            </div>
          ) : (
            <div className="clock-ready-card">
              <span className="ready-title">No active session</span>
              <span className="ready-text">Open iTracksy to start tracking your focus time.</span>
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
  const targetMinutes =
    activeEntry.targetDuration ||
    (activeEntry.isFocusMode ? FOCUS_DEFAULT_MINUTES : BREAK_DEFAULT_MINUTES);

  // Status text
  const getStatusText = (): string => {
    if (clockState.isPaused) return "Paused";
    if (clockState.isRunning) return "Running";
    return "Ready";
  };

  return (
    <div className={getShellClasses()}>
      {!isMinimalView && (
        <header className="clock-header no-drag">
          <div className="clock-status">
            <span className="clock-mode-icon">
              <ModeIcon size={20} strokeWidth={2} />
            </span>
            <div className="clock-mode-text">
              <span className="clock-mode-label">
                {activeEntry.isFocusMode ? "Focus Mode" : "Break Time"}
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
              {isPinned ? <Pin size={15} /> : <PinOff size={15} />}
            </button>
            <button
              type="button"
              className="icon-button no-drag"
              onClick={handleShowMain}
              title="Open iTracksy"
            >
              <Maximize2 size={15} />
            </button>
            <button type="button" className="icon-button no-drag" onClick={handleHide} title="Hide">
              <X size={15} />
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
                <ModeIcon size={22} strokeWidth={2} />
              </span>
            )}
            <span className="clock-timer-display">
              {formatTime(remainingTime)}
              {unlimited && (
                <span className="unlimited-indicator">
                  <InfinityIcon size={20} />
                </span>
              )}
            </span>
          </div>
          {!isMinimalView && <span className="timer-hint">Click for compact view</span>}
        </button>
        {!unlimited && !isMinimalView && (
          <div className="clock-progress-track">
            <div className="clock-progress-meter" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
        {!isMinimalView && (
          <div className="clock-meta-row">
            <span className="clock-meta-item">
              {targetMinutes > 0 ? `${formatMinutes(targetMinutes)} target` : "Unlimited"}
            </span>
            <span className="clock-meta-item">
              <span
                className={`status-dot ${clockState.isPaused ? "paused" : clockState.isRunning ? "running" : ""}`}
              />
              {getStatusText()}
            </span>
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
