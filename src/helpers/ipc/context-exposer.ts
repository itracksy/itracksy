import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeNotificationContext } from "./notification/notification-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeNotificationContext();
}
