import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
    success: boolean;
    error?: string;
    data?: any;
}

class MCPIntegrationTest {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;

    async connectClient(): Promise<void> {
        console.log('🔌 Connecting MCP client...');
        
        const serverPath = path.resolve(__dirname, '..', 'index.js');
        console.log(`Server path: ${serverPath}`);

        this.transport = new StdioClientTransport({
            command: 'node',
            args: [serverPath],
            env: { 
                ...process.env, 
                DONT_FORGET_DATA_DIR: path.join(__dirname, '..', '..', 'test-data') 
            }
        });

        this.client = new Client(
            {
                name: "integration-test-client",
                version: "1.0.0"
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        console.log('📡 Attempting to connect transport...');
        await this.client.connect(this.transport);
        console.log('✅ Client connected successfully');
    }

    async testListTools(): Promise<TestResult> {
        console.log('🔍 Testing listTools...');
        
        if (!this.client) {
            return { success: false, error: 'Client not connected' };
        }

        try {
            console.log('📤 Sending listTools request...');
            const response = await this.client.listTools();
            console.log('📥 Received listTools response:', JSON.stringify(response, null, 2));
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('❌ listTools failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async testListResources(): Promise<TestResult> {
        console.log('🔍 Testing listResources...');
        
        if (!this.client) {
            return { success: false, error: 'Client not connected' };
        }

        try {
            console.log('📤 Sending listResources request...');
            const response = await this.client.listResources();
            console.log('📥 Received listResources response:', JSON.stringify(response, null, 2));
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('❌ listResources failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async testListPrompts(): Promise<TestResult> {
        console.log('🔍 Testing listPrompts...');
        
        if (!this.client) {
            return { success: false, error: 'Client not connected' };
        }

        try {
            console.log('📤 Sending listPrompts request...');
            const response = await this.client.listPrompts();
            console.log('📥 Received listPrompts response:', JSON.stringify(response, null, 2));
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('❌ listPrompts failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async testCallTool(): Promise<TestResult> {
        console.log('🔍 Testing callTool (get-potential-context)...');
        
        if (!this.client) {
            return { success: false, error: 'Client not connected' };
        }

        try {
            console.log('📤 Sending callTool request...');
            const response = await this.client.callTool({
                name: 'get-potential-context',
                arguments: {
                    taskSummary: 'Testing the integration',
                    componentsOfInterest: ['test', 'integration']
                }
            });
            console.log('📥 Received callTool response:', JSON.stringify(response, null, 2));
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('❌ callTool failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    async cleanup(): Promise<void> {
        console.log('🧹 Cleaning up...');
        
        if (this.transport) {
            try {
                await this.transport.close();
            } catch (error) {
                console.warn('Warning: Error closing transport:', error);
            }
        }
        
        console.log('✅ Cleanup completed');
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting MCP Integration Tests');
        console.log('=' .repeat(50));

        try {
            await this.connectClient();

            console.log('\n📋 Running test suite...');
            
            const listToolsResult = await this.testListTools();
            const listResourcesResult = await this.testListResources();
            const listPromptsResult = await this.testListPrompts();
            const callToolResult = await this.testCallTool();

            console.log('\n📊 Test Results:');
            console.log('=' .repeat(50));
            console.log(`listTools: ${listToolsResult.success ? '✅ PASS' : '❌ FAIL'}`);
            if (!listToolsResult.success) console.log(`  Error: ${listToolsResult.error}`);
            
            console.log(`listResources: ${listResourcesResult.success ? '✅ PASS' : '❌ FAIL'}`);
            if (!listResourcesResult.success) console.log(`  Error: ${listResourcesResult.error}`);
            
            console.log(`listPrompts: ${listPromptsResult.success ? '✅ PASS' : '❌ FAIL'}`);
            if (!listPromptsResult.success) console.log(`  Error: ${listPromptsResult.error}`);
            
            console.log(`callTool: ${callToolResult.success ? '✅ PASS' : '❌ FAIL'}`);
            if (!callToolResult.success) console.log(`  Error: ${callToolResult.error}`);

            const totalTests = 4;
            const passedTests = [listToolsResult, listResourcesResult, listPromptsResult, callToolResult]
                .filter(result => result.success).length;
            
            console.log('\n🏁 Summary:');
            console.log(`Tests passed: ${passedTests}/${totalTests}`);
            
            if (passedTests === totalTests) {
                console.log('🎉 All tests passed!');
            } else {
                console.log('⚠️  Some tests failed. Check the output above for details.');
            }

        } catch (error) {
            console.error('💥 Test suite failed to run:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
async function main() {
    const test = new MCPIntegrationTest();
    await test.runAllTests();
}

main().catch(console.error); 