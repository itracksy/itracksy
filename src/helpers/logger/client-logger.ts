import { BaseLogger } from "./base-logger";
import { LogLevel } from "./types";

export class ClientLogger extends BaseLogger {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    super();
    this.sessionId = crypto.randomUUID();
  }

  setUserInformation({ userId, sessionId }: { userId: string; sessionId: string }) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG, "console")) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO, "console")) {
      console.info(message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN, "console")) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR, "console")) {
      console.error(message, ...args);
    }
  }

  fatal(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.FATAL, "console")) {
      console.error(message, ...args);
    }
  }
}
