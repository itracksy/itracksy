import { atomWithStorage } from "jotai/utils";
import { localKey } from "./localKey";
import { ActivityRecord } from "@/types/activity";

export const activityWindowAtom = atomWithStorage<ActivityRecord[]>(localKey.ACTIVITY_WINDOW, []);

export const accessibilityPermissionAtom = atomWithStorage(
  localKey.ACCESSIBILITY_PERMISSION,
  false
);

export const boardStorageKeyAtom = atomWithStorage(localKey.BOARD_STORAGE_KEY, "");

export const screenRecordingPermissionAtom = atomWithStorage(
  localKey.SCREEN_RECORDING_PERMISSION,
  false
);

export const isTrackingAtom = atomWithStorage(localKey.IS_TRACKING, false);

export const isFocusModeAtom = atomWithStorage(localKey.IS_FOCUS_MODE, false);
