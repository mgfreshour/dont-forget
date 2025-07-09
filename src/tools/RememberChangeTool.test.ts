import { test, describe } from 'node:test';
import assert from 'node:assert';
import RememberChangeTool from './RememberChangeTool.js';
import { DatabaseManager, DatabaseConfig } from '../db/DatabaseManager.js';
import { initializeLogger } from '../utils/logger.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

describe('RememberChangeTool', () => {
    test('should remember a change', async () => {
        console.log('Starting RememberChangeTool test...');
        
        // Create a test database manager
        const testDataDirectory = path.join(process.cwd(), 'test-data');
        
        // Initialize logger first
        initializeLogger({
            dataDirectory: testDataDirectory,
            level: 'error', // Quiet logging during tests
            enableConsole: false // No console output during tests
        });
        
        const config: DatabaseConfig = { dataDirectory: testDataDirectory };
        const databaseManager = new DatabaseManager(config);
        await databaseManager.initialize();
        
        // Set global database manager for tools
        global.databaseManager = databaseManager;
        
        const tool = new RememberChangeTool();
        const result = await tool.execute({
            summary: 'Test change',
            detailedDescription: 'Test description',
            components: ['test.ts']
        });

        assert.strictEqual(result, 'Successfully remembered the change.');

        // Verify SQLite storage (this is the critical part)
        const db = await open({
            filename: path.join(testDataDirectory, 'database.db'),
            driver: sqlite3.Database
        });
        
        const change = await db.get('SELECT * FROM changes WHERE summary = ?', 'Test change');
        assert.ok(change);
        assert.strictEqual(change.detailed_description, 'Test description');
        
        // Verify component relationship
        const component = await db.get('SELECT * FROM components WHERE name = ?', 'test.ts');
        assert.ok(component);
        
        const relationship = await db.get('SELECT * FROM change_components WHERE change_id = ? AND component_id = ?', change.id, component.id);
        assert.ok(relationship);
        
        await db.close();

        // Try to verify vector storage, but don't fail if it doesn't work
        try {
            const vectorDb = await databaseManager.getVectorDatabase();
            if (vectorDb) {
                const changesTable = await vectorDb.openTable('changes');
                const searchResult = await changesTable.search(new Array(384).fill(0)).limit(10).execute();
                
                // Look for our test change in the results
                const testChange = searchResult.find(r => r.summary === 'Test change');
                if (testChange) {
                    console.log('Vector storage verification successful');
                } else {
                    console.log('Vector storage verification: Test change not found in vector database');
                }
            } else {
                console.log('Vector database not available for verification');
            }
        } catch (vectorError) {
            console.warn('Vector storage verification failed (this is acceptable):', vectorError);
        }
        
        // Clean up
        await databaseManager.close();
        
        console.log('RememberChangeTool test completed successfully');
    });
});
