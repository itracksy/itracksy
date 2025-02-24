import { atomWithStorage } from "jotai/utils";
import { localKey } from "./localKey";

export const selectedBoardIdAtom = atomWithStorage(localKey.BOARD_SELECTED_KEY, "");
export const breakEndTimeAtom = atomWithStorage<number | null>(localKey.BREAK_END_TIME_KEY, null);
