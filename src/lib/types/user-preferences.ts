/**
 * User Preferences System
 * Allows users to customize their itracksy experience
 */

export type ThemeVariant =
  | "default" // Standard brand theme (purple/pink)
  | "professional" // Subtle blues and grays
  | "comfort" // Warm, easy on the eyes
  | "vibrant" // High contrast, energetic
  | "minimal" // Clean, distraction-free
  | "nature"; // Greens and earth tones

export type ThemeMode = "light" | "dark";

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

export type UISize = "compact" | "comfortable" | "spacious";
export type FontScale = "small" | "normal" | "large" | "x-large";
export type AnimationSpeed = "none" | "reduced" | "normal" | "enhanced";

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
export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
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

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
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

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 70,
  showDesktopNotifications: true,
  showInAppNotifications: true,
  focusReminders: true,
  breakReminders: true,
  goalAchievements: true,
};

export const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
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
export interface ThemeVariantDefinition {
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
    name: "Default",
    description: "Classic itracksy brand colors - purple and pink gradient",
    colors: {
      primary: "#8B5CF6",
      secondary: "#EC4899",
      accent: "#06B6D4",
      background: "#FFFFFF",
      foreground: "#111827",
    },
    bestFor: ["Modern", "Professional", "Brand consistency"],
  },
  professional: {
    name: "Professional",
    description: "Subtle blues and grays for a business environment",
    colors: {
      primary: "#1E40AF",
      secondary: "#3B82F6",
      accent: "#0891B2",
      background: "#F8FAFC",
      foreground: "#0F172A",
    },
    bestFor: ["Business", "Corporate", "Minimal distraction"],
  },
  comfort: {
    name: "Comfort",
    description: "Warm tones that are easy on the eyes for extended use",
    colors: {
      primary: "#D97706",
      secondary: "#F59E0B",
      accent: "#10B981",
      background: "#FFFBEB",
      foreground: "#78350F",
    },
    bestFor: ["Long sessions", "Eye comfort", "Warm atmosphere"],
  },
  vibrant: {
    name: "Vibrant",
    description: "High contrast and energetic colors for maximum focus",
    colors: {
      primary: "#DC2626",
      secondary: "#F59E0B",
      accent: "#10B981",
      background: "#FFFFFF",
      foreground: "#000000",
    },
    bestFor: ["Energy boost", "High visibility", "Creative work"],
  },
  minimal: {
    name: "Minimal",
    description: "Clean, distraction-free monochrome aesthetic",
    colors: {
      primary: "#374151",
      secondary: "#6B7280",
      accent: "#9CA3AF",
      background: "#FFFFFF",
      foreground: "#111827",
    },
    bestFor: ["Focus", "Simplicity", "Distraction-free"],
  },
  nature: {
    name: "Nature",
    description: "Calming greens and earth tones for a natural feel",
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#14B8A6",
      background: "#F0FDF4",
      foreground: "#064E3B",
    },
    bestFor: ["Calm", "Wellness", "Natural atmosphere"],
  },
};
