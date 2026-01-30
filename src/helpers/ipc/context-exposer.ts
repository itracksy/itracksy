import { exposeThemeContext } from "./theme/theme-context";
import { exposeNotificationContext } from "./notification/notification-context";
import { exposeNavigationContext } from "./navigation/navigation-context";
import { exposeSessionPauseContext } from "./session-pause/session-pause-context";
import { exposePermissionContext } from "./permission/permission-context";

export default function exposeContexts() {
  exposeThemeContext();
  exposeNotificationContext();
  exposeNavigationContext();
  exposeSessionPauseContext();
  exposePermissionContext();
}
