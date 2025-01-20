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

const defaultBlockedDomains = [
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com",
  "youtube.com",
  "netflix.com",
  "discord.com",
  "twitch.tv",
];

const defaultBlockedApps = [
  "Discord",
  "Slack",
  "Messages",
  "Mail",
  "Facebook",
  "Twitter",
  "Instagram",
  "TikTok",
  "Netflix",
  "Spotify",
  "Steam",
  "Epic Games",
  "Battle.net",
];

export const blockedDomainsAtom = atomWithStorage<string[]>(
  localKey.BLOCKED_DOMAINS,
  defaultBlockedDomains
);
export const blockedAppsAtom = atomWithStorage<string[]>(localKey.BLOCKED_APPS, defaultBlockedApps);

export const isTrackingAtom = atomWithStorage(localKey.IS_TRACKING, false);

export const isFocusModeAtom = atomWithStorage(localKey.IS_FOCUS_MODE, false);
