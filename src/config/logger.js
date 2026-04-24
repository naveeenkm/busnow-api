import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const { combine, timestamp, colorize, printf, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const base = `${timestamp} {${level}}: ${stack || message}`;
  const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return base + extra;
});

const isVercel = !!process.env.VERCEL;

const transports = [
  new winston.transports.Console({
    format: combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), consoleFormat),
  }),
];

if (!isVercel) {
  const { default: DailyRotateFile } = await import('winston-daily-rotate-file');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logsDir = path.join(__dirname, '../../logs');
  transports.push(
    new DailyRotateFile({ dirname: logsDir, filename: 'error-%DATE%.log', datePattern: 'YYYY-MM-DD', level: 'error', maxFiles: '14d' }),
    new DailyRotateFile({ dirname: logsDir, filename: 'combined-%DATE%.log', datePattern: 'YYYY-MM-DD', maxFiles: '14d' }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'http',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
});

const log = (level, category, message, meta = {}) =>
  logger[level](`[${category}] ${message}`, { category, ...meta });

export const logInfo = (message, meta = {}) => log('info', 'Info', message, meta);
export const logWarn = (message, meta = {}) => log('warn', 'Warn', message, meta);
export const logError = (message, meta = {}) => log('error', 'Error', message, meta);
export const logDebug = (message, meta = {}) => log('debug', 'Debug', message, meta);
export const logHttp = (message, meta = {}) => log('http', 'Http', message, meta);

export default logger;
