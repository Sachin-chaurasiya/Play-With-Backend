import { createLogger, format, transports } from "winston";

const { combine, timestamp, label, printf, colorize } = format;

/**
 * Custom logger format.
 */
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `[${level}] [${timestamp}] [${label}]: ${message}`;
});

/**
 * Create a logger instance with the given configuration.
 */
const logger = createLogger({
  format: combine(
    label({ label: "Play With Backend" }),
    timestamp(),
    myFormat,
    colorize({ all: true })
  ),
  transports: [new transports.Console()],
});

export default logger;
