export interface NotificationOptions {
  title: string;
  body: string;
  silent?: boolean;
  requireInteraction?: boolean;
  timeoutMs?: number;
}
