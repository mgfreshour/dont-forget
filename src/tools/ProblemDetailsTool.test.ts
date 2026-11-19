import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import ProblemDetailsTool from './ProblemDetailsTool.js';
import { DatabaseManager, DatabaseConfig } from '../db/DatabaseManager.js';
import { initializeLogger } from '../utils/logger.js';
import path from 'path';

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

describe('ProblemDetailsTool', () => {
    let tool: ProblemDetailsTool;
    let testProblemId: number;
    let databaseManager: DatabaseManager;

    beforeEach(async () => {
        console.log('Setting up ProblemDetailsTool test...');
        
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
        tool = new ProblemDetailsTool();
        
        // Store a test problem and get its ID
        await databaseManager.storeProblem(
            'Test problem for details',
            'The correct action was to refactor the code and fix the issue properly.',
            ['problem-component.ts', 'fix-component.ts']
        );
        
        // Query the database to find the ID of our test problem
        const sqliteManager = await databaseManager.getSQLiteManager();
        const db = await sqliteManager.getDatabase();
        const result = await db.get('SELECT id FROM problems WHERE summary = ?', 'Test problem for details');
        testProblemId = result?.id;
        
        console.log(`Test problem stored with ID: ${testProblemId}`);
    });

    afterEach(async () => {
        if (databaseManager) {
            await databaseManager.close();
        }
        console.log('ProblemDetailsTool test completed successfully');
    });

    test('should get problem details', async () => {
        const result = await tool.execute({ id: testProblemId });
        
        console.log(`Tool result for ID ${testProblemId}:`, result);
        
        assert(result.includes(`Problem Details (ID: ${testProblemId})`));
        assert(result.includes('Test problem for details'));
        assert(result.includes('The correct action was to refactor'));
        assert(result.includes('problem-component.ts'));
        assert(result.includes('fix-component.ts'));
        
        console.log('ProblemDetailsTool result:', result);
    });

    test('should handle non-existent problem ID', async () => {
        const result = await tool.execute({ id: 99999 });
        
        assert(result.includes('Problem with ID "99999" not found'));
        
        console.log('Non-existent problem result:', result);
    });
}); 