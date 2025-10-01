import { useCallback, useEffect, useRef } from "react";

type AudioContextConstructor = typeof AudioContext;

interface UsePomodoroSoundsParams {
  readonly isFocusMode: boolean;
  readonly targetMinutes: number;
  readonly remainingSeconds: number | null;
  readonly sessionId: string;
  readonly playStartSound: boolean;
  readonly playIntervalSound: boolean;
  readonly playCompletionSound: boolean;
  readonly playBreakStartSound: boolean;
  readonly playBreakCompletionSound: boolean;
}
const INTERVAL_MINUTES = 10;
const INTERVAL_SECONDS = INTERVAL_MINUTES * 60;
const MAX_VOLUME = 0.2;
const START_CUE_THRESHOLD_SECONDS = 15;

const focusStartSessions = new Set<string>();
const breakStartSessions = new Set<string>();
const breakCompletionSessions = new Set<string>();

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const typedWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? typedWindow.webkitAudioContext ?? null;
}

function buildIntervalThresholds(totalSeconds: number): number[] {
  const thresholds: number[] = [];
  const totalMinutes = Math.floor(totalSeconds / 60);
  for (let minute = INTERVAL_MINUTES; minute < totalMinutes; minute += INTERVAL_MINUTES) {
    thresholds.push(minute * 60);
  }
  return thresholds.sort((a, b) => a - b);
}

export function usePomodoroSounds({
  isFocusMode,
  targetMinutes,
  remainingSeconds,
  sessionId,
  playStartSound,
  playIntervalSound,
  playCompletionSound,
  playBreakStartSound,
  playBreakCompletionSound,
}: UsePomodoroSoundsParams): void {
  const audioContextRef = useRef<AudioContext | null>(null);
  const playedThresholdsRef = useRef<Set<number>>(new Set());
  const previousSessionIdRef = useRef<string>("idle");
  const previousIsFocusRef = useRef<boolean | null>(null);
  const previousRemainingRef = useRef<number | null>(null);
  const focusStartPlayedRef = useRef<boolean>(false);
  const awaitingFocusStartRef = useRef<boolean>(false);
  const breakStartPlayedRef = useRef<boolean>(false);
  const breakCompletionPlayedRef = useRef<boolean>(false);

  const ensureAudioContext = useCallback((): AudioContext | null => {
    const constructor = getAudioContextConstructor();
    if (!constructor) {
      return null;
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new constructor();
    }
    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, durationMs: number): void => {
      const context = ensureAudioContext();
      if (!context) {
        return;
      }
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      const now = context.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(MAX_VOLUME, now + 0.01);
      const stopTime = now + durationMs / 1000;
      gainNode.gain.linearRampToValueAtTime(0, stopTime);
      oscillator.start(now);
      oscillator.stop(stopTime);
    },
    [ensureAudioContext]
  );

  const playIntervalCue = useCallback((): void => {
    playTone(880, 200);
  }, [playTone]);

  const playCompletionCue = useCallback((): void => {
    playTone(660, 220);
    window.setTimeout(() => {
      playTone(440, 320);
    }, 140);
  }, [playTone]);

  const playStartCue = useCallback((): void => {
    playTone(523.25, 240);
    window.setTimeout(() => {
      playTone(659.25, 180);
    }, 120);
  }, [playTone]);

  const playBreakStartCue = useCallback((): void => {
    playTone(392, 200);
    window.setTimeout(() => {
      playTone(523.25, 180);
    }, 120);
  }, [playTone]);

  const playBreakCompletionCue = useCallback((): void => {
    playTone(494, 220);
    window.setTimeout(() => {
      playTone(370, 260);
    }, 160);
  }, [playTone]);

  useEffect(() => {
    const sessionChanged = previousSessionIdRef.current !== sessionId || previousIsFocusRef.current !== isFocusMode;
    if (!sessionChanged) {
      return;
    }
    playedThresholdsRef.current = new Set<number>();
    previousSessionIdRef.current = sessionId;
    previousIsFocusRef.current = isFocusMode;
    const isFocusSession = isFocusMode && sessionId !== "idle";
    const isBreakSession = !isFocusMode && sessionId !== "idle";
    if (!sessionId || sessionId === "idle") {
      focusStartPlayedRef.current = false;
      awaitingFocusStartRef.current = false;
      breakStartPlayedRef.current = false;
      breakCompletionPlayedRef.current = false;
      return;
    }
    if (isFocusSession) {
      const alreadyPlayed = focusStartSessions.has(sessionId);
      focusStartPlayedRef.current = alreadyPlayed;
      awaitingFocusStartRef.current = !alreadyPlayed;
      breakStartPlayedRef.current = true;
      breakCompletionPlayedRef.current = true;
      return;
    }
    const alreadyPlayedBreakStart = breakStartSessions.has(sessionId);
    const alreadyPlayedBreakCompletion = breakCompletionSessions.has(sessionId);
    focusStartPlayedRef.current = true;
    awaitingFocusStartRef.current = false;
    breakStartPlayedRef.current = alreadyPlayedBreakStart;
    breakCompletionPlayedRef.current = alreadyPlayedBreakCompletion;
  }, [sessionId, isFocusMode]);

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (!context) {
        return;
      }
      context.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const previousRemaining = previousRemainingRef.current;
    previousRemainingRef.current = remainingSeconds;
    const totalSeconds = targetMinutes * 60;
    const isUnlimited = targetMinutes <= 0;
    const elapsedSeconds = !isUnlimited && remainingSeconds !== null ? totalSeconds - remainingSeconds : null;
    const isFocusSession = isFocusMode && sessionId !== "idle";
    const isBreakSession = !isFocusMode && sessionId !== "idle";
    if (
      playStartSound &&
      isFocusSession &&
      !isUnlimited &&
      remainingSeconds !== null &&
      remainingSeconds > 0 &&
      previousRemaining !== null &&
      previousRemaining > remainingSeconds &&
      elapsedSeconds !== null &&
      elapsedSeconds >= 0 &&
      elapsedSeconds <= START_CUE_THRESHOLD_SECONDS &&
      awaitingFocusStartRef.current &&
      !focusStartPlayedRef.current
    ) {
      focusStartPlayedRef.current = true;
      awaitingFocusStartRef.current = false;
      focusStartSessions.add(sessionId);
      playStartCue();
    } else if (awaitingFocusStartRef.current && elapsedSeconds !== null && elapsedSeconds > START_CUE_THRESHOLD_SECONDS) {
      awaitingFocusStartRef.current = false;
    }
    if (isBreakSession && playBreakStartSound && !breakStartPlayedRef.current && remainingSeconds !== null) {
      const countdownStarted = previousRemaining !== null ? previousRemaining > remainingSeconds : elapsedSeconds !== null;
      if (countdownStarted) {
        breakStartPlayedRef.current = true;
        breakStartSessions.add(sessionId);
        playBreakStartCue();
      }
    }
    if (isBreakSession) {
      if (remainingSeconds === null) {
        return;
      }
      if (remainingSeconds <= 0 && playBreakCompletionSound && !breakCompletionPlayedRef.current && (previousRemaining === null || previousRemaining > 0)) {
        breakCompletionPlayedRef.current = true;
        breakCompletionSessions.add(sessionId);
        playBreakCompletionCue();
      }
      return;
    }
    if (isUnlimited || remainingSeconds === null) {
      awaitingFocusStartRef.current = false;
      return;
    }
    if (remainingSeconds <= 0) {
      awaitingFocusStartRef.current = false;
      if (playCompletionSound && (previousRemaining === null || previousRemaining > 0) && !playedThresholdsRef.current.has(0)) {
        playedThresholdsRef.current.add(0);
        playCompletionCue();
      }
      return;
    }
    if (!playIntervalSound || totalSeconds <= INTERVAL_SECONDS) {
      return;
    }
    const thresholds = buildIntervalThresholds(totalSeconds);
    for (const threshold of thresholds) {
      const alreadyPlayed = playedThresholdsRef.current.has(threshold);
      const crossedThreshold = remainingSeconds <= threshold && (previousRemaining === null || previousRemaining > threshold);
      if (!alreadyPlayed && crossedThreshold) {
        playedThresholdsRef.current.add(threshold);
        playIntervalCue();
        break;
      }
    }
  }, [
    playStartSound,
    isFocusMode,
    targetMinutes,
    remainingSeconds,
    sessionId,
    playIntervalSound,
    playCompletionSound,
    playBreakStartSound,
    playBreakCompletionSound,
    playIntervalCue,
    playCompletionCue,
    playStartCue,
    playBreakStartCue,
    playBreakCompletionCue
  ]);
}
