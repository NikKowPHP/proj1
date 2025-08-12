
const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

type LogLevel = keyof typeof LOG_LEVELS;

const log = (level: LogLevel, message: string, context?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  const loggerMethod = {
    INFO: console.log,
    WARN: console.warn,
    ERROR: console.error,
  }[level];

  if (context) {
    loggerMethod(logMessage, context);
  } else {
    loggerMethod(logMessage);
  }
};

export const logger = {
  info: (message: string, context?: any) => log("INFO", message, context),
  warn: (message: string, context?: any) => log("WARN", message, context),
  error: (message: string, context?: any) => log("ERROR", message, context),
};