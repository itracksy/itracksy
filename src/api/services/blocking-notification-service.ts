import {
  BlockingNotificationData,
  sendBlockingNotificationToWindow,
} from "../../helpers/blocking-notification/blocking-notification-utils";

export function showBlockingNotification(data: BlockingNotificationData): Promise<number> {
  return sendBlockingNotificationToWindow(data);
}
