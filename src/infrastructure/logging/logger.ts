import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Create correlation ID for request tracking
export const createCorrelationId = (): string => uuidv4();

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        correlationId,
        ...meta,
      });
    })
  ),
  defaultMeta: {
    service: 'projector-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json(),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
  }));
}

export { logger };