import { format, createLogger, transports } from 'winston';
import { envorimentVariables } from '../env/envoriment';

export const errosLevels = {
  emerg: 0,
  crit: 1,
  hight: 2,
  medium: 4,
  low: 5,
  silly: 6,
  debug: 7,
};

const winstonLogger = createLogger({
  level: 'info',

  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.label(),
    format.printf(({ level, message, timestamp, label }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.Http({
      host: `http://localhost:${envorimentVariables.port}/api-docs`,
    }),
    new transports.File({
      filename: 'app_message.log',
      dirname: './logs',
    }),
  ],
});

export default winstonLogger;
