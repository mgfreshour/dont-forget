import { DatabaseManager, DatabaseConfig } from './db/DatabaseManager.js';
import { initializeLogger } from './utils/logger.js';
import fs from 'fs';
import path from 'path';

export default async () => {
    console.log('Starting test setup...');
    
    // Use a test-specific data directory
    const testDataDirectory = path.join(process.cwd(), 'test-data');
    
    // Initialize logger first (required by DatabaseManager)
    initializeLogger({
        dataDirectory: testDataDirectory,
        level: 'error', // Quiet logging during tests
        enableConsole: false // No console output during tests
    });
    
    // Clean up existing test databases
    try {
        if (fs.existsSync(testDataDirectory)) {
            fs.rmSync(testDataDirectory, { recursive: true, force: true });
        }
    } catch (error) {
        console.warn('Could not clean up existing test databases:', error);
    }

    // Initialize database manager for tests
    const config: DatabaseConfig = {
        dataDirectory: testDataDirectory
    };

    const databaseManager = new DatabaseManager(config);
    await databaseManager.initialize();
    
    console.log('Test setup completed successfully');
};
