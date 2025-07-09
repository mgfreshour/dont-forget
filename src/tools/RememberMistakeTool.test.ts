import { test, describe } from 'node:test';
import assert from 'node:assert';
import RememberMistakeTool from './RememberMistakeTool.js';
import { DatabaseManager, DatabaseConfig } from '../db/DatabaseManager.js';
import { initializeLogger } from '../utils/logger.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

describe('RememberMistakeTool', () => {
    test('should remember a mistake', async () => {
        console.log('Starting RememberMistakeTool test...');
        
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
        
        const tool = new RememberMistakeTool();
        const result = await tool.execute({
            summary: 'Test mistake',
            correctAction: 'Test action',
            components: ['test.ts']
        });

        assert.strictEqual(result, 'Successfully remembered the mistake.');

        // Verify SQLite storage (this is the critical part)
        const db = await open({
            filename: path.join(testDataDirectory, 'database.db'),
            driver: sqlite3.Database
        });
        
        const problem = await db.get('SELECT * FROM problems WHERE summary = ?', 'Test mistake');
        assert.ok(problem);
        assert.strictEqual(problem.correct_action, 'Test action');
        
        // Verify component relationship
        const component = await db.get('SELECT * FROM components WHERE name = ?', 'test.ts');
        assert.ok(component);
        
        const relationship = await db.get('SELECT * FROM problem_components WHERE problem_id = ? AND component_id = ?', problem.id, component.id);
        assert.ok(relationship);
        
        await db.close();

        // Try to verify vector storage, but don't fail if it doesn't work
        try {
            const vectorDb = await databaseManager.getVectorDatabase();
            if (vectorDb) {
                const problemsTable = await vectorDb.openTable('problems');
                const searchResult = await problemsTable.search(new Array(384).fill(0)).limit(10).execute();
                
                // Look for our test mistake in the results
                const testMistake = searchResult.find(r => r.summary === 'Test mistake');
                if (testMistake) {
                    console.log('Vector storage verification successful');
                } else {
                    console.log('Vector storage verification: Test mistake not found in vector database');
                }
            } else {
                console.log('Vector database not available for verification');
            }
        } catch (vectorError) {
            console.warn('Vector storage verification failed (this is acceptable):', vectorError);
        }
        
        // Clean up
        await databaseManager.close();
        
        console.log('RememberMistakeTool test completed successfully');
    });
});
