import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { Client } from "@axiomhq/axiom-node";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";

const isElectron = typeof app !== "undefined";

// Log levels in order of severity
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal"
}

// Environment-specific configuration
const LOG_CONFIG = {
  development: {
    console: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    file: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    axiom: [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
  },
  production: {
    console: [LogLevel.ERROR, LogLevel.FATAL],
    file: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    axiom: [LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
  }
};

class Logger {
  private logPath: string | null = null;
  private axiomClient: Client | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private environment: "development" | "production";
  private lastLogTime: { [key: string]: number } = {};
  private readonly rateLimitMs = 1000; // Rate limit of 1 second

  constructor() {
    this.environment = app?.isPackaged ? "production" : "development";
    
    if (isElectron) {
      const userDataPath = app.getPath("userData");
      this.logPath = path.join(userDataPath, "logs.txt");
      this.sessionId = uuidv4();

      const axiomToken = config.axiomToken;
      const axiomOrgId = config.axiomOrgId;

      if (axiomToken && axiomOrgId) {
        this.axiomClient = new Client({
          token: axiomToken,
          orgId: axiomOrgId,
        });
      }

      // Ensure log directory exists
      const logDir = path.dirname(this.logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  public setUserInformation({ userId, sessionId }: { userId: string; sessionId?: string }) {
    this.userId = userId;
    if (sessionId) {
      this.sessionId = sessionId;
    }
  }

  private shouldLog(level: LogLevel, target: 'console' | 'file' | 'axiom'): boolean {
    const config = LOG_CONFIG[this.environment];
    return config[target].includes(level);
  }

  private isRateLimited(key: string): boolean {
    const now = Date.now();
    if (this.environment === 'production' && this.lastLogTime[key]) {
      if (now - this.lastLogTime[key] < this.rateLimitMs) {
        return true;
      }
    }
    this.lastLogTime[key] = now;
    return false;
  }

  private async sendToAxiom(level: LogLevel, message: string, args: any[]) {
    if (!this.axiomClient || !this.shouldLog(level, 'axiom')) return;

    try {
      const event = {
        _time: new Date().toISOString(),
        level,
        message,
        args: args.length > 0 ? args : undefined,
        app: "itracksy",
        process: "main",
        version: app.getVersion(),
        environment: this.environment,
        platform: process.platform,
        arch: process.arch,
        sessionId: this.sessionId,
        userId: this.userId,
      };

      if (!this.isRateLimited(`axiom-${level}-${message}`)) {
        await this.axiomClient.ingestEvents(config.axiomDataset, event);
      }
    } catch (error) {
      console.error("Failed to send logs to Axiom:", error);
    }
  }

  private writeToFile(level: LogLevel, message: string, args: any[]) {
    if (!this.logPath || !this.shouldLog(level, 'file')) return;

    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg).join(" ")}\n`;

      if (!this.isRateLimited(`file-${level}-${message}`)) {
        fs.appendFileSync(this.logPath, logMessage);
      }
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private logToConsole(level: LogLevel, message: string, args: any[]) {
    if (!this.shouldLog(level, 'console')) return;

    const consoleMethod = {
      [LogLevel.DEBUG]: console.debug,
      [LogLevel.INFO]: console.log,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error,
      [LogLevel.FATAL]: console.error
    }[level];

    consoleMethod(`[${level.toUpperCase()}]`, message, ...args);
  }

  public async log(level: LogLevel, message: string, ...args: any[]) {
    this.logToConsole(level, message, args);
    this.writeToFile(level, message, args);
    await this.sendToAxiom(level, message, args);
  }

  // Convenience methods
  public debug(message: string, ...args: any[]) {
    return this.log(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: any[]) {
    return this.log(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    return this.log(LogLevel.WARN, message, ...args);
  }

  public error(message: string, ...args: any[]) {
    return this.log(LogLevel.ERROR, message, ...args);
  }

  public fatal(message: string, ...args: any[]) {
    return this.log(LogLevel.FATAL, message, ...args);
  }
}

export const logger = new Logger();
