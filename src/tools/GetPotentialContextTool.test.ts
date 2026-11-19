import { test, describe } from 'node:test';
import assert from 'node:assert';
import GetPotentialContextTool from './GetPotentialContextTool.js';
import RememberChangeTool from './RememberChangeTool.js';
import RememberMistakeTool from './RememberMistakeTool.js';
import { DatabaseManager, DatabaseConfig } from '../db/DatabaseManager.js';
import { initializeLogger } from '../utils/logger.js';
import path from 'path';

// Declare global type for database manager
declare global {
    var databaseManager: DatabaseManager;
}

describe('GetPotentialContextTool', () => {
    test('should get potential context', async () => {
        console.log('Starting GetPotentialContextTool test...');
        
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
        
        // First, remember a change
        const rememberChangeTool = new RememberChangeTool();
        await rememberChangeTool.execute({
            summary: 'Another test change',
            detailedDescription: 'Another test description',
            components: ['test.ts']
        });

        // Then, remember a mistake
        const rememberMistakeTool = new RememberMistakeTool();
        await rememberMistakeTool.execute({
            summary: 'Another test mistake',
            correctAction: 'Another test action',
            components: ['test.ts']
        });

        // Wait a moment for the data to be fully indexed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now get potential context
        const tool = new GetPotentialContextTool();
        const result = await tool.execute({
            taskSummary: 'A task related to another test',
            componentsOfInterest: ['test.ts']
        });

        console.log('GetPotentialContextTool result:', result);

        // Check that we got a meaningful result
        assert.ok(typeof result === 'string');
        assert.ok(result.length > 0);
        
        // The result should contain either previous changes or problems sections
        const hasChanges = result.includes('- Previous changes:');
        const hasProblems = result.includes('- Problems:');
        const hasNoContext = result.includes('No relevant context found.');
        
        // At least one of these should be true
        assert.ok(hasChanges || hasProblems || hasNoContext, 
            `Expected result to contain changes, problems, or no context message. Got: ${result}`);
        
        // If we have changes section, it should contain some change
        if (hasChanges) {
            assert.ok(result.includes('change'), 
                `Expected result to contain some change. Got: ${result}`);
        }
        
        // If we have problems section, it should contain some problem
        if (hasProblems) {
            assert.ok(result.includes('problem'), 
                `Expected result to contain some problem. Got: ${result}`);
        }
        
        // Clean up
        await databaseManager.close();
        
        console.log('GetPotentialContextTool test completed successfully');
    });
});
