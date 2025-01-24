import { BaseLogger } from "./logger/base-logger";

export let logger: BaseLogger;

export const initLoggerServer = async () => {
  // Import the appropriate logger based on environment
  const LoggerClass = (await import("./logger/server-logger")).ServerLogger;

  logger = new LoggerClass();
  console.log("logger initialized", logger);

  return logger;
};

export const initLoggerClient = async () => {
  // Import the appropriate logger based on environment
  const LoggerClass = (await import("./logger/client-logger")).ClientLogger;

  logger = new LoggerClass();
  console.log("logger initialized", logger);

  return logger;
};
