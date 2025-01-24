import { LogLevel } from "./types";

export abstract class BaseLogger {
  protected environment: "development" | "production";
  protected lastLogTime: { [key: string]: number } = {};
  protected readonly rateLimitMs = 1000; // Rate limit of 1 second

  constructor() {
    this.environment = process.env.NODE_ENV === "production" ? "production" : "development";
  }

  protected shouldLog(level: LogLevel, target: "console" | "file" | "axiom"): boolean {
    const config = LOG_CONFIG[this.environment];
    return config[target].includes(level);
  }

  protected isRateLimited(key: string): boolean {
    const now = Date.now();
    if (this.lastLogTime[key] && now - this.lastLogTime[key] < this.rateLimitMs) {
      return true;
    }
    this.lastLogTime[key] = now;
    return false;
  }
  abstract getFileContent(): Promise<string>;
  abstract setUserInformation({ userId, sessionId }: { userId: string; sessionId: string }): void;
  abstract debug(message: string, ...args: any[]): void;
  abstract info(message: string, ...args: any[]): void;
  abstract warn(message: string, ...args: any[]): void;
  abstract error(message: string, ...args: any[]): void;
  abstract fatal(message: string, ...args: any[]): void;
}

// Log levels configuration
export const LOG_CONFIG = {
  development: {
    console: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    file: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    axiom: [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
  },
  production: {
    console: [LogLevel.ERROR, LogLevel.FATAL],
    file: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    axiom: [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
  },
};
