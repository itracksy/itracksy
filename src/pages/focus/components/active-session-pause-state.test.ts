import {
  isPauseStateRelevantToSession,
  shouldRefetchActiveSessionForPauseState,
} from "./active-session-pause-state";

describe("active session pause state helpers", () => {
  it("treats a pause event for the current session as relevant", () => {
    expect(
      isPauseStateRelevantToSession(
        {
          isPaused: true,
          timeEntryId: "session-1",
        },
        "session-1"
      )
    ).toBe(true);
  });

  it("ignores a pause event for another session", () => {
    expect(
      isPauseStateRelevantToSession(
        {
          isPaused: true,
          timeEntryId: "session-2",
        },
        "session-1"
      )
    ).toBe(false);
  });

  it("treats unpause events as relevant so the active query can resync", () => {
    expect(
      isPauseStateRelevantToSession(
        {
          isPaused: false,
          timeEntryId: null,
        },
        "session-1"
      )
    ).toBe(true);
  });

  it("only refetches the active session query for unpause events", () => {
    expect(
      shouldRefetchActiveSessionForPauseState({
        isPaused: true,
        timeEntryId: "session-1",
      })
    ).toBe(false);

    expect(
      shouldRefetchActiveSessionForPauseState({
        isPaused: false,
        timeEntryId: null,
      })
    ).toBe(true);
  });
});
