import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { Client, ContentType, ContentEncoding } from "@axiomhq/axiom-node";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";

const isElectron = typeof app !== "undefined";

class Logger {
  private logPath: string | null = null;
  private axiomClient: Client | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  constructor() {
    if (isElectron) {
      // Get the user data path (this is where Electron stores app data)
      // It will be different for dev and production
      const userDataPath = app.getPath("userData");
      this.logPath = path.join(userDataPath, "logs.txt");

      this.sessionId = uuidv4();
      // Initialize Axiom client if credentials are available
      const axiomToken = config.axiomToken;
      const axiomOrgId = config.axiomOrgId;

      if (axiomToken && axiomOrgId) {
        this.axiomClient = new Client({
          token: axiomToken,
          orgId: axiomOrgId,
        });
      }
    }
  }

  public setUserInformation({ userId, sessionId }: { userId: string; sessionId?: string }) {
    this.userId = userId;
    if (sessionId) {
      this.sessionId = sessionId;
    }
  }
  private async sendToAxiom(level: string, message: string, args: any[]) {
    if (!this.axiomClient) return;

    try {
      const event = await this.axiomClient.ingestEvents(config.axiomDataset, {
        _time: new Date().toISOString(),
        level,
        message,
        args: args.length > 0 ? args : undefined,
        app: "itracksy",
        process: "main",
        version: app.getVersion(),
        environment: app.isPackaged ? "production" : "development",
        platform: process.platform,
        arch: process.arch,
        sessionId: this.sessionId, // Unique session ID for grouping related logs
        userId: this.userId, // You can update this with actual user ID when available
      });
      console.log("Sent logs to Axiom:", event);
    } catch (error) {
      console.error("Failed to send logs to Axiom:", error);
    }
  }

  public async log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.log(message, ...args);

    // Write to file only in Electron environment
    if (isElectron && this.logPath) {
      fs.appendFileSync(this.logPath, logMessage);
      // Send to Axiom
      await this.sendToAxiom("info", message, args);
    }
  }

  public async error(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.error(message, ...args);

    // Write to file only in Electron environment
    if (isElectron && this.logPath) {
      fs.appendFileSync(this.logPath, logMessage);
      // Send to Axiom
      await this.sendToAxiom("error", message, args);
    }
  }

  public async warn(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.warn(message, ...args);

    // Write to file only in Electron environment
    if (isElectron && this.logPath) {
      fs.appendFileSync(this.logPath, logMessage);
      // Send to Axiom
      await this.sendToAxiom("warn", message, args);
    }
  }
}

export const logger = new Logger();
