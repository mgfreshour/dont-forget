import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import ChangeDetailsTool from './ChangeDetailsTool.js';
import { DatabaseManager, DatabaseConfig } from '../db/DatabaseManager.js';
import { initializeLogger } from '../utils/logger.js';
import path from 'path';

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

describe('ChangeDetailsTool', () => {
    beforeEach(async () => {
        console.log('Setting up ChangeDetailsTool test...');
        
        // Initialize logger first
        const testDataDirectory = path.join(process.cwd(), 'test-data');
        initializeLogger({
            dataDirectory: testDataDirectory,
            level: 'error', // Quiet logging during tests
            enableConsole: false // No console output during tests
        });
        
        databaseManager = new DatabaseManager({
            dataDirectory: testDataDirectory
        });
        await databaseManager.initialize();
        
        // Set global database manager
        global.databaseManager = databaseManager;
        
        // Create tool instance
        tool = new ChangeDetailsTool();
        
        // Store a test change and get its ID
        await databaseManager.storeChange(
            'Test change for details',
            'This is a detailed description of the test change for verification purposes.',
            ['test-component.ts', 'another-component.ts']
        );
        
        // Query the database to find the ID of our test change
        const sqliteManager = await databaseManager.getSQLiteManager();
        const db = await sqliteManager.getDatabase();
        const result = await db.get('SELECT id FROM changes WHERE summary = ?', 'Test change for details');
        testChangeId = result?.id;
        
        console.log(`Test change stored with ID: ${testChangeId}`);
    });

    after(async () => {
        if (databaseManager) {
            await databaseManager.close();
        }
        console.log('ChangeDetailsTool test completed successfully');
    });

    it('should get change details', async () => {
        const result = await tool.execute({ id: testChangeId });
        
        console.log(`Tool result for ID ${testChangeId}:`, result);
        
        assert(result.includes(`Change Details (ID: ${testChangeId})`));
        assert(result.includes('Test change for details'));
        assert(result.includes('This is a detailed description'));
        assert(result.includes('test-component.ts'));
        assert(result.includes('another-component.ts'));
        
        console.log('ChangeDetailsTool result:', result);
    });

    it('should handle non-existent change ID', async () => {
        const result = await tool.execute({ id: 99999 });
        
        assert(result.includes('Change with ID 99999 not found'));
        
        console.log('Non-existent change result:', result);
    });
}); 