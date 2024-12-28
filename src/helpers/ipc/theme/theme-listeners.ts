import { nativeTheme } from "electron";

import {
  THEME_MODE_CURRENT_CHANNEL,
  THEME_MODE_DARK_CHANNEL,
  THEME_MODE_LIGHT_CHANNEL,
  THEME_MODE_SYSTEM_CHANNEL,
  THEME_MODE_TOGGLE_CHANNEL,
} from "./theme-channels";
import { safelyRegisterListener } from "../safelyRegisterListener";

export function addThemeEventListeners() {
  safelyRegisterListener(THEME_MODE_CURRENT_CHANNEL, () => nativeTheme.themeSource);
  safelyRegisterListener(THEME_MODE_TOGGLE_CHANNEL, () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = "light";
    } else {
      nativeTheme.themeSource = "dark";
    }
    return nativeTheme.shouldUseDarkColors;
  });
  safelyRegisterListener(THEME_MODE_DARK_CHANNEL, () => (nativeTheme.themeSource = "dark"));
  safelyRegisterListener(THEME_MODE_LIGHT_CHANNEL, () => (nativeTheme.themeSource = "light"));
  safelyRegisterListener(THEME_MODE_SYSTEM_CHANNEL, () => {
    nativeTheme.themeSource = "system";
    return nativeTheme.shouldUseDarkColors;
  });
}
