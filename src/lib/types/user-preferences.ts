/**
 * User Preferences System
 * Allows users to customize their itracksy experience
 */

export type ThemeVariant =
  | "default" // Natural slate blue (base theme)
  | "ocean" // Cool blues inspired by calm waters
  | "forest" // Earthy greens for a natural feel
  | "lavender" // Soft purple for creative minds
  | "sunset" // Warm oranges and corals
  | "rose" // Soft pinks for a gentle feel
  | "monochrome"; // Pure grayscale for minimal distraction

type ThemeMode = "light" | "dark";

export type SidebarItem =
  | "focus-session"
  | "scheduling"
  | "projects"
  | "categorization"
  | "classify"
  | "analytics"
  | "focus-music"
  | "reports"
  | "logs"
  | "settings";

type UISize = "compact" | "comfortable" | "spacious";
type FontScale = "small" | "normal" | "large" | "x-large";
type AnimationSpeed = "none" | "reduced" | "normal" | "enhanced";

export interface SidebarPreferences {
  // Visible sidebar items
  visibleItems: SidebarItem[];
  // Collapsed by default
  collapsed: boolean;
  // Pin certain items to top
  pinnedItems: SidebarItem[];
}

export interface AppearancePreferences {
  // Theme
  themeMode: ThemeMode;
  themeVariant: ThemeVariant;

  // Typography
  fontScale: FontScale;
  fontFamily?: "default" | "sans" | "mono" | "dyslexic";

  // Layout
  uiSize: UISize;
  showAnimations: AnimationSpeed;
  reducedMotion: boolean;

  // Visual density
  compactMode: boolean;
  showIcons: boolean;
  roundedCorners: boolean;
}

export interface NotificationPreferences {
  // Sound
  soundEnabled: boolean;
  soundVolume: number; // 0-100

  // Visual
  showDesktopNotifications: boolean;
  showInAppNotifications: boolean;

  // Specific notifications
  focusReminders: boolean;
  breakReminders: boolean;
  goalAchievements: boolean;
}

export interface FocusPreferences {
  // Focus mode defaults
  defaultFocusDuration: number; // minutes
  defaultBreakDuration: number; // minutes

  // Session behavior
  autoStartBreaks: boolean;
  autoStartNextSession: boolean;

  // Distractions
  dimInactiveWindows: boolean;
  hideDistractions: boolean;
}

export interface UserPreferences {
  // Core preferences
  sidebar: SidebarPreferences;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
  focus: FocusPreferences;

  // Metadata
  version: number;
  lastUpdated: number; // timestamp
}

// Default preferences
const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  visibleItems: [
    "focus-session",
    "scheduling",
    "projects",
    "categorization",
    "classify",
    "analytics",
    "focus-music",
    "reports",
    "logs",
    "settings",
  ],
  collapsed: false,
  pinnedItems: ["focus-session"],
};

const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  themeMode: "light",
  themeVariant: "default",
  fontScale: "normal",
  fontFamily: "default",
  uiSize: "comfortable",
  showAnimations: "normal",
  reducedMotion: false,
  compactMode: false,
  showIcons: true,
  roundedCorners: true,
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 70,
  showDesktopNotifications: true,
  showInAppNotifications: true,
  focusReminders: true,
  breakReminders: true,
  goalAchievements: true,
};

const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  autoStartNextSession: false,
  dimInactiveWindows: false,
  hideDistractions: false,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  sidebar: DEFAULT_SIDEBAR_PREFERENCES,
  appearance: DEFAULT_APPEARANCE_PREFERENCES,
  notifications: DEFAULT_NOTIFICATION_PREFERENCES,
  focus: DEFAULT_FOCUS_PREFERENCES,
  version: 1,
  lastUpdated: Date.now(),
};

// Theme variant definitions
interface ThemeVariantDefinition {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  bestFor: string[];
}

export const THEME_VARIANTS: Record<ThemeVariant, ThemeVariantDefinition> = {
  default: {
    name: "Natural",
    description: "Calm slate blue - balanced and professional",
    colors: {
      primary: "#5a7a99",
      secondary: "#4a9a8c",
      accent: "#4a9a8c",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Focus", "Professional", "All-purpose"],
  },
  ocean: {
    name: "Ocean",
    description: "Cool blues inspired by calm waters",
    colors: {
      primary: "#3d8eb9",
      secondary: "#4aa3a3",
      accent: "#4aa3a3",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Calm", "Clarity", "Deep work"],
  },
  forest: {
    name: "Forest",
    description: "Earthy greens for a natural, grounded feel",
    colors: {
      primary: "#4a9a6a",
      secondary: "#5a9a7a",
      accent: "#5a9a7a",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Nature", "Balance", "Wellness"],
  },
  lavender: {
    name: "Lavender",
    description: "Soft purple tones for creative minds",
    colors: {
      primary: "#8a6aaa",
      secondary: "#9a7aba",
      accent: "#9a7aba",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Creative", "Inspiration", "Gentle focus"],
  },
  sunset: {
    name: "Sunset",
    description: "Warm oranges and corals for an energizing feel",
    colors: {
      primary: "#bf7a4a",
      secondary: "#c9684a",
      accent: "#c9684a",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Energy", "Warmth", "Motivation"],
  },
  rose: {
    name: "Rose",
    description: "Soft pinks for a gentle, caring atmosphere",
    colors: {
      primary: "#b96a7a",
      secondary: "#c97a8a",
      accent: "#c97a8a",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Gentle", "Comfort", "Self-care"],
  },
  monochrome: {
    name: "Monochrome",
    description: "Pure grayscale for minimal distraction",
    colors: {
      primary: "#595959",
      secondary: "#737373",
      accent: "#737373",
      background: "#fafafa",
      foreground: "#262626",
    },
    bestFor: ["Focus", "Simplicity", "No distraction"],
  },
};
