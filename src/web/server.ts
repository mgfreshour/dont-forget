import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from '../db/DatabaseManager.js';
import { createApiRoutes } from './routes/api.js';
import { createLogRoutes } from './routes/logs.js';
import { getLogger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createDebugWebServer(databaseManager: DatabaseManager, port: number): Promise<void> {
    const logger = getLogger();
    const app = express();
    
    // Middleware
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // Static files
    app.use(express.static(path.join(__dirname, 'static')));
    
    // API routes
    app.use('/api', createApiRoutes(databaseManager));
    app.use('/api/logs', createLogRoutes(databaseManager));
    
    // Serve main interface
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'static', 'index.html'));
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            version: '0.0.1'
        });
    });
    
    // Start server
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            logger.info('Debug web server started', { 
                port, 
                url: `http://localhost:${port}` 
            });
            resolve();
        });
        
        server.on('error', (error) => {
            logger.error('Web server failed to start', { 
                port, 
                error: error instanceof Error ? error.message : error 
            });
            reject(error);
        });
    });
} 