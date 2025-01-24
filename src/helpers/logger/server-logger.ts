import { app } from "electron";
import type { Client } from "@axiomhq/axiom-node";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config/env";
import { BaseLogger } from "./base-logger";
import { LogLevel } from "./types";
import * as fs from "fs";
import * as path from "path";

export class ServerLogger extends BaseLogger {
  private logPath: string;
  private axiomClient: Client | null = null;
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    super();
    this.sessionId = uuidv4();
    const userDataPath = app.getPath("userData");
    this.logPath = path.join(userDataPath, "logs.txt");

    // Initialize Axiom client if tokens are available
    if (config.axiomToken && config.axiomOrgId) {
      import("@axiomhq/axiom-node").then(({ Client }) => {
        this.axiomClient = new Client({
          token: config.axiomToken,
          orgId: config.axiomOrgId,
        });
      });
    }
  }

  setUserInformation({ userId, sessionId }: { userId: string; sessionId: string }) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  private async logToFile(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
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
    if (!this.axiomClient) return;

    try {
      await this.axiomClient.ingestEvents(config.axiomDataset, [
        {
          timestamp: new Date(),
          level,
          message,
          sessionId: this.sessionId,
          userId: this.userId,
          args,
        },
      ]);
    } catch (error) {
      console.error("Failed to send log to Axiom:", error);
    }
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
}
