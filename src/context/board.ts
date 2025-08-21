import { atomWithStorage } from "jotai/utils";
import { localKey } from "./localKey";

export const selectedBoardIdAtom = atomWithStorage(localKey.BOARD_SELECTED_KEY, "");
export const selectedItemIdAtom = atomWithStorage(localKey.SELECTED_ITEM_ID_KEY, "");
export const breakDurationAtom = atomWithStorage<number>(localKey.BREAK_DURATION_KEY, 5);
export const targetMinutesAtom = atomWithStorage<number>(localKey.TARGET_MINUTES_KEY, 25);
export const autoStopEnabledsAtom = atomWithStorage<boolean>(localKey.AUTO_STOP_ENABLED, true);
export const isUnlimitedFocusAtom = atomWithStorage<boolean>(localKey.IS_UNLIMITED_FOCUS, false);
export const isUnlimitedBreakAtom = atomWithStorage<boolean>(localKey.IS_UNLIMITED_BREAK, false);
