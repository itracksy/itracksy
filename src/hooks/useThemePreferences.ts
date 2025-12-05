import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

/**
 * Hook to apply user theme preferences to the document
 * This manages all visual customization settings
 */
export function useThemePreferences() {
  const { data: preferences } = useQuery({
    queryKey: ["user.getPreferences"],
    queryFn: async () => {
      return trpcClient.user.getPreferences.query();
    },
  });

  useEffect(() => {
    if (!preferences) return;

    const root = document.documentElement;
    const { appearance } = preferences;

    // Apply theme variant
    root.setAttribute("data-theme-variant", appearance.themeVariant);

    // Apply font scale
    root.setAttribute("data-font-scale", appearance.fontScale);

    // Apply font family
    if (appearance.fontFamily) {
      root.setAttribute("data-font-family", appearance.fontFamily);
    }

    // Apply UI size
    root.setAttribute("data-ui-size", appearance.uiSize);

    // Apply animation speed
    root.setAttribute("data-animation-speed", appearance.showAnimations);

    // Apply reduced motion
    root.setAttribute("data-reduced-motion", appearance.reducedMotion.toString());

    // Apply rounded corners preference
    root.setAttribute("data-rounded-corners", appearance.roundedCorners.toString());

    // Apply compact mode class
    if (appearance.compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }

    // Apply show icons preference
    if (!appearance.showIcons) {
      root.classList.add("hide-icons");
    } else {
      root.classList.remove("hide-icons");
    }
  }, [preferences]);

  return preferences;
}
