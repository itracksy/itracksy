import { atomWithStorage } from "jotai/utils";
import { localKey } from "./localKey";

export const selectedBoardIdAtom = atomWithStorage(localKey.BOARD_SELECTED_KEY, "");
export const breakDurationAtom = atomWithStorage<number>(localKey.BREAK_DURATION_KEY, 5);
