const winston = require("winston");
const path = require("path");

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
);

// Logger instance
const logger = winston.createLogger({
  level: logLevel, // Log level changes based on environment
  format: logFormat,
  transports: [
    // Console logs for development
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    
    // General log file
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "app.log"),
      level: "info",
      format: winston.format.json(), // Structured JSON logs for better analysis
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
      format: winston.format.json(),
    }),
  ],
});

// Handle uncaught exceptions & rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join(__dirname, "logs", "exceptions.log") })
);

logger.rejections.handle(
  new winston.transports.File({ filename: path.join(__dirname, "logs", "rejections.log") })
);

module.exports = logger;
