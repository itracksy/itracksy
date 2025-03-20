import { app } from "electron";
import type { Client } from "@axiomhq/axiom-node";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { LogLevel } from "./types";

// Log levels configuration
const LOG_CONFIG = {
  development: {
    console: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    file: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    axiom: [LogLevel.ERROR, LogLevel.FATAL],
  },
  production: {
    console: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    file: [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
    axiom: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL],
  },
};

export class ServerLogger {
  private logPath: string;
  private axiomClient: Client | null = null;
  private userId: string | null = null;
  private sessionId: string;
  private environment: "development" | "production";
  private config: { axiomToken?: string; axiomOrgId?: string; axiomDataset?: string } = {};

  constructor() {
    this.environment = process.env.NODE_ENV === "production" ? "production" : "development";
    this.sessionId = uuidv4();
    const userDataPath = app?.getPath("userData") ?? "";
    this.logPath = path.join(userDataPath, "logs.txt");
    console.log("Log path:", this.logPath);

    // Only load config and initialize Axiom client in production
    if (this.environment === "production") {
      this.initializeProduction();
    }
  }

  private async initializeProduction() {
    try {
      // Dynamic import of config to avoid loading it in development
      const { config } = await import("../../config/env");
      this.config = config;

      // Initialize Axiom client if tokens are available
      if (config.axiomToken && config.axiomOrgId) {
        const { Client } = await import("@axiomhq/axiom-node");
        this.axiomClient = new Client({
          token: config.axiomToken,
          orgId: config.axiomOrgId,
        });
      }
    } catch (error) {
      console.error("Failed to initialize production logger:", error);
    }
  }

  setUserInformation({ userId, sessionId }: { userId: string; sessionId: string }) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  private async logToFile(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = Date.now();
    const logEntry = {
      timestamp,
      level,
      message,
      sessionId: this.sessionId,
      userId: this.userId,
      args,
    };

    try {
      await fs.promises.appendFile(this.logPath, JSON.stringify(logEntry) + "\n", "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private async logToAxiom(level: LogLevel, message: string, ...args: any[]) {
    if (!this.axiomClient || this.environment !== "production") return;

    try {
      this.axiomClient.ingestEvents(this.config.axiomDataset || "default", [
        {
          timestamp: new Date(),
          level,
          message,
          sessionId: this.sessionId,
          userId: this.userId,
          appversion: app.getVersion(),
          platform: process.platform,
          args,
        },
      ]);
    } catch (error) {
      console.error("Failed to send log to Axiom:", error);
    }
  }

  private shouldLog(level: LogLevel, target: "console" | "file" | "axiom"): boolean {
    const config = LOG_CONFIG[this.environment];
    return config[target].includes(level);
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG, "file")) {
      this.logToFile(LogLevel.DEBUG, message, ...args);
    }
    if (this.shouldLog(LogLevel.DEBUG, "axiom")) {
      this.logToAxiom(LogLevel.DEBUG, message, ...args);
    }
    if (this.shouldLog(LogLevel.DEBUG, "console")) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO, "file")) {
      this.logToFile(LogLevel.INFO, message, ...args);
    }
    if (this.shouldLog(LogLevel.INFO, "axiom")) {
      this.logToAxiom(LogLevel.INFO, message, ...args);
    }
    if (this.shouldLog(LogLevel.INFO, "console")) {
      console.info(message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN, "file")) {
      this.logToFile(LogLevel.WARN, message, ...args);
    }
    if (this.shouldLog(LogLevel.WARN, "axiom")) {
      this.logToAxiom(LogLevel.WARN, message, ...args);
    }
    if (this.shouldLog(LogLevel.WARN, "console")) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR, "file")) {
      this.logToFile(LogLevel.ERROR, message, ...args);
    }
    if (this.shouldLog(LogLevel.ERROR, "axiom")) {
      this.logToAxiom(LogLevel.ERROR, message, ...args);
    }
    if (this.shouldLog(LogLevel.ERROR, "console")) {
      console.error(message, ...args);
    }
  }

  fatal(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.FATAL, "file")) {
      this.logToFile(LogLevel.FATAL, message, ...args);
    }
    if (this.shouldLog(LogLevel.FATAL, "axiom")) {
      this.logToAxiom(LogLevel.FATAL, message, ...args);
    }
    if (this.shouldLog(LogLevel.FATAL, "console")) {
      console.error("FATAL:", message, ...args);
    }
  }

  async clearLogFile(): Promise<void> {
    try {
      await fs.promises.writeFile(this.logPath, "", { encoding: "utf-8" });
      this.debug("[ServerLogger] Log file cleared successfully");
    } catch (error) {
      this.error("[ServerLogger] Failed to clear log file", error);
    }
  }

  async getFileContent(): Promise<string> {
    try {
      const content = await fs.promises.readFile(this.logPath, "utf8");
      return content;
    } catch (error) {
      console.error("Failed to read log file:", error);
      return "";
    }
  }
}
