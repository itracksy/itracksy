import { atomWithStorage } from "jotai/utils";
import { localKey } from "./localKey";

export const selectedBoardIdAtom = atomWithStorage(localKey.BOARD_STORAGE_KEY, "");
