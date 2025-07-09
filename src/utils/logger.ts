import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

export interface LoggerConfig {
    dataDirectory: string;
    level?: string;
    enableConsole?: boolean;
}

class Logger {
    private winston: winston.Logger;
    private dataDirectory: string;

    constructor(config: LoggerConfig) {
        this.dataDirectory = config.dataDirectory;
        this.winston = this.createLogger(config);
    }

    private createLogger(config: LoggerConfig): winston.Logger {
        // Ensure logs directory exists
        const logsDir = path.join(config.dataDirectory, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const transports: winston.transport[] = [];

        // File transport with daily rotation
        const fileTransport = new DailyRotateFile({
            filename: path.join(logsDir, 'dont-forget-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d', // Keep logs for 14 days
            level: config.level || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            )
        });

        transports.push(fileTransport);

        // Error file (separate file for errors)
        const errorTransport = new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d', // Keep error logs longer
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            )
        });

        transports.push(errorTransport);

        // Console transport only for development/debugging
        // IMPORTANT: This goes to stderr, never stdout (which is reserved for MCP)
        if (config.enableConsole) {
            const consoleTransport = new winston.transports.Console({
                level: config.level || 'info',
                stderrLevels: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        let log = `${timestamp} [${level}] ${message}`;
                        if (Object.keys(meta).length > 0) {
                            log += ` ${JSON.stringify(meta)}`;
                        }
                        return log;
                    })
                )
            });

            transports.push(consoleTransport);
        }

        return winston.createLogger({
            level: config.level || 'info',
            defaultMeta: { service: 'dont-forget-mcp' },
            transports,
            // Prevent winston from exiting on uncaught exceptions
            exitOnError: false
        });
    }

    // Standard logging methods
    error(message: string, meta?: any): void {
        this.winston.error(message, meta);
    }

    warn(message: string, meta?: any): void {
        this.winston.warn(message, meta);
    }

    info(message: string, meta?: any): void {
        this.winston.info(message, meta);
    }

    debug(message: string, meta?: any): void {
        this.winston.debug(message, meta);
    }

    verbose(message: string, meta?: any): void {
        this.winston.verbose(message, meta);
    }

    // Specialized methods for common use cases
    mcpRequest(method: string, params?: any): void {
        this.debug('MCP Request', { method, params });
    }

    mcpResponse(method: string, result?: any): void {
        this.debug('MCP Response', { method, result });
    }

    toolExecution(toolName: string, input: any, duration?: number): void {
        this.info('Tool Execution', { toolName, input, duration });
    }

    databaseOperation(operation: string, table?: string, duration?: number): void {
        this.debug('Database Operation', { operation, table, duration });
    }

    // Performance logging
    performance(operation: string, duration: number, meta?: any): void {
        this.info('Performance', { operation, duration, ...meta });
    }

    // Get the underlying winston instance if needed
    getWinstonLogger(): winston.Logger {
        return this.winston;
    }

    // Close all transports gracefully
    async close(): Promise<void> {
        return new Promise((resolve) => {
            this.winston.end(() => {
                resolve();
            });
        });
    }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function initializeLogger(config: LoggerConfig): Logger {
    globalLogger = new Logger(config);
    return globalLogger;
}

export function getLogger(): Logger {
    if (!globalLogger) {
        throw new Error('Logger not initialized. Call initializeLogger() first.');
    }
    return globalLogger;
}

export { Logger }; 