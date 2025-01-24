import { app } from "electron";
import * as path from "path";
import * as fs from "fs";

const isElectron = typeof app !== 'undefined';

class Logger {
  private logPath: string | null = null;

  constructor() {
    if (isElectron) {
      // Get the user data path (this is where Electron stores app data)
      // It will be different for dev and production
      const userDataPath = app.getPath("userData");
      this.logPath = path.join(userDataPath, "logs.txt");
      console.log("Logging to", this.logPath);
    }
  }

  public log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.log(message, ...args);

    // Write to file only in Electron environment
    if (isElectron && this.logPath) {
      fs.appendFileSync(this.logPath, logMessage);
    }
  }

  public error(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.error(message, ...args);

    // Write to file only in Electron environment
    if (isElectron && this.logPath) {
      fs.appendFileSync(this.logPath, logMessage);
    }
  }

  public warn(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.warn(message, ...args);

    // Write to file only in Electron environment
    if (isElectron && this.logPath) {
      fs.appendFileSync(this.logPath, logMessage);
    }
  }
}

export const logger = new Logger();
