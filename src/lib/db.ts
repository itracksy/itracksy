import Database, { Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";

// Get the correct path for resources
const getResourcePath = () => {
  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "data");
  }
  return path.join(process.cwd(), "data");
};

// Ensure data directory exists
const dataDir = getResourcePath();
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize the database
const dbPath = path.join(dataDir, "database.sqlite");
const mydb: DatabaseType = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
mydb.pragma("foreign_keys = ON");

// Create tables if they don't exist
mydb.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

mydb.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    platform TEXT,
    title TEXT,
    owner_path TEXT,
    owner_process_id TEXT,
    owner_bundle_id TEXT,
    owner_name TEXT,
    url TEXT,
    timestamp TEXT,
    count INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Helper function to get formatted date
const getFormattedDate = () => {
  return new Date().toISOString();
};

// Update the updated_at timestamp when rows are modified
mydb.function("CURRENT_TIMESTAMP", () => getFormattedDate());

export default mydb;
