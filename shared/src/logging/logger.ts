type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

function makePrefix(bindings?: Record<string, unknown>) {
  if (!bindings) return "";
  try {
    return ` ${JSON.stringify(bindings)}`;
  } catch {
    return "";
  }
}

function baseLogger(bindings?: Record<string, unknown>): Logger {
  const prefix = makePrefix(bindings);
  const log = (level: LogLevel) => (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console[level](`[${level.toUpperCase()}]${prefix}`, ...args);
  };
  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    child: (b: Record<string, unknown>) => baseLogger({ ...(bindings || {}), ...b }),
  };
}

export const logger: Logger = baseLogger();
