import { app } from "electron";
import * as path from "path";
import * as fs from "fs";

class Logger {
  private logPath: string;

  constructor() {
    // Get the user data path (this is where Electron stores app data)
    // It will be different for dev and production
    const userDataPath = app.getPath("userData");
    this.logPath = path.join(userDataPath, "logs.txt");
  }

  public log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.log(message, ...args);

    // Write to file
    fs.appendFileSync(this.logPath, logMessage);
  }

  public error(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message} ${args.map((arg) => JSON.stringify(arg)).join(" ")}\n`;

    // Write to console
    console.error(message, ...args);

    // Write to file
    fs.appendFileSync(this.logPath, logMessage);
  }
}

export const logger = new Logger();
