import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import GetComponentHistoryTool from './GetComponentHistoryTool.js';
import { DatabaseManager, DatabaseConfig } from '../db/DatabaseManager.js';
import { initializeLogger } from '../utils/logger.js';
import path from 'path';

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

describe('GetComponentHistoryTool', () => {
    beforeEach(async () => {
        console.log('Setting up GetComponentHistoryTool test...');
        
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
        tool = new GetComponentHistoryTool();
        
        // Store test data with the same component
        await databaseManager.storeChange(
            'First change for TestComponent',
            'This is the first change made to TestComponent.',
            ['TestComponent.ts', 'OtherComponent.ts']
        );
        
        await databaseManager.storeChange(
            'Second change for TestComponent',
            'This is the second change made to TestComponent.',
            ['TestComponent.ts']
        );
        
        await databaseManager.storeProblem(
            'Bug in TestComponent',
            'Fixed the bug by refactoring the logic.',
            ['TestComponent.ts']
        );
        
        await databaseManager.storeProblem(
            'Performance issue in TestComponent',
            'Optimized the algorithm for better performance.',
            ['TestComponent.ts', 'UtilsComponent.ts']
        );
    });

    afterEach(async () => {
        if (databaseManager) {
            await databaseManager.close();
        }
        console.log('GetComponentHistoryTool test completed successfully');
    });

    it('should get component history with changes and problems', async () => {
        const result = await tool.execute({ name: 'TestComponent.ts' });
        
        console.log('Component history result:', result);
        
        assert(result.includes('Component History: TestComponent.ts'));
        assert(result.includes('Changes (2)'));
        assert(result.includes('First change for TestComponent'));
        assert(result.includes('Second change for TestComponent'));
        assert(result.includes('Problems (2)'));
        assert(result.includes('Bug in TestComponent'));
        assert(result.includes('Performance issue in TestComponent'));
        assert(result.includes('change-details('));
        assert(result.includes('problem-details('));
    });

    it('should handle component with no history', async () => {
        const result = await tool.execute({ name: 'NonExistentComponent.ts' });
        
        console.log('Non-existent component result:', result);
        
        assert(result.includes('Component History: NonExistentComponent.ts'));
        assert(result.includes('No changes found for this component'));
        assert(result.includes('No problems found for this component'));
    });
}); 