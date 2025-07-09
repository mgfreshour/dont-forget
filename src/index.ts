import { MCPServer } from "mcp-framework";
import path from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";
import { DatabaseManager, DatabaseConfig } from "./db/DatabaseManager.js";
import { createDebugWebServer } from "./web/server.js";
import { initializeLogger, getLogger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

// Command line argument parsing
const program = new Command();

program
    .name('dont-forget')
    .description('MCP server for memory and context tools')
    .version('0.0.1')
    .option('--debug-server', 'Start web server for debugging')
    .option('--web-port <port>', 'Port for web server (default: 3001)', '3001')
    .option('--data-dir <path>', 'Data directory for databases', process.env.DONT_FORGET_DATA_DIR || path.join(process.cwd(), 'data'))
    .option('--log-level <level>', 'Log level (error, warn, info, debug, verbose)', 'info')
    .option('--enable-console-logs', 'Enable console logging (goes to stderr)')
    .parse();

const options = program.opts();

// Get data directory from command line or environment variable
const dataDirectory = options.dataDir;
const config: DatabaseConfig = {
    dataDirectory: dataDirectory
};

// Initialize logger first
const logger = initializeLogger({
    dataDirectory: dataDirectory,
    level: options.logLevel,
    enableConsole: options.enableConsoleLogs
});

logger.info('Starting dont-forget MCP server', { 
    dataDirectory,
    debugServer: options.debugServer,
    webPort: options.webPort,
    logLevel: options.logLevel
});

if (options.debugServer) {
    logger.info('Debug web server will be started', { port: options.webPort });
}

// Initialize database manager
const databaseManager = new DatabaseManager(config);

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
    logger.info('Received shutdown signal', { signal });
    
    try {
        logger.info('Closing database connections...');
        await databaseManager.close();
        
        logger.info('Closing logger...');
        await logger.close();
        
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize database first
databaseManager.initialize().then(async () => {
    logger.info('Database manager initialized successfully');
    
    // Store database manager globally so tools can access it
    global.databaseManager = databaseManager;

    // Start debug web server if requested
    if (options.debugServer) {
        try {
            await createDebugWebServer(databaseManager, parseInt(options.webPort));
            logger.info('Debug web server started', { port: options.webPort });
        } catch (error) {
            logger.error('Failed to start debug web server', { error: error instanceof Error ? error.message : error });
            process.exit(1);
        }
    }

    // Create server with proper configuration for MCP framework
    const server = new MCPServer({
        name: "dont-forget",
        version: "0.0.1",
        basePath: path.resolve(__dirname),
    });

    // Start the server - mcp-framework will automatically discover and load tools
    await server.start();
    logger.info('MCP server started successfully', { toolsCount: 6 });

}).catch((error) => {
    logger.error('Failed to initialize database manager', { 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
});
