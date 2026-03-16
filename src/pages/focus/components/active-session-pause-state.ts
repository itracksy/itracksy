export interface ActiveSessionPauseState {
  readonly isPaused: boolean;
  readonly timeEntryId: string | null;
}

export const isPauseStateRelevantToSession = (
  state: ActiveSessionPauseState,
  activeTimeEntryId: string | undefined
): boolean => {
  return state.timeEntryId === activeTimeEntryId || !state.isPaused;
};

export const shouldRefetchActiveSessionForPauseState = (
  state: ActiveSessionPauseState
): boolean => {
  return !state.isPaused;
};
