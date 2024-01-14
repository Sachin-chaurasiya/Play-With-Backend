import { createLogger, format, transports } from "winston";

const { combine, timestamp, label, printf, colorize } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `[${label}] [${timestamp}] [${level}]: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: "Chai Aur Backend" }),
    timestamp(),
    myFormat,
    colorize({ all: true })
  ),
  transports: [new transports.Console()],
});

export default logger;
