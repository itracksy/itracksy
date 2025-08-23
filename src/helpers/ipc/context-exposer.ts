import { exposeThemeContext } from "./theme/theme-context";
import { exposeNotificationContext } from "./notification/notification-context";

export default function exposeContexts() {
  exposeThemeContext();
  exposeNotificationContext();
}
