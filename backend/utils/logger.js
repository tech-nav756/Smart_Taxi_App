const winston = require('winston');

// Configure the logger
const logger = winston.createLogger({
  level: 'info', // Default log level
  format: winston.format.combine(
    winston.format.colorize(), // Colorize the output for readability
    winston.format.timestamp(), // Add timestamp to logs
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    // Console transport for logging to the console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple() // Simple format for console logs
      ),
    }),
    // File transport for logging to a file
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info', // Log all levels starting from 'info' to 'error'
    }),
  ],
});

// Optionally, you can log uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.Console({ format: winston.format.simple() }),
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

logger.rejections.handle(
  new winston.transports.Console({ format: winston.format.simple() }),
  new winston.transports.File({ filename: 'logs/rejections.log' })
);

module.exports = logger;
