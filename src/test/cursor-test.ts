import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawMessage {
    jsonrpc: string;
    method?: string;
    id?: string | number;
    params?: any;
    result?: any;
    error?: any;
}

class CursorMCPTest {
    private serverProcess: ChildProcess | null = null;
    private messageId = 1;

    async startServer(): Promise<void> {
        console.log('🚀 Starting MCP server for Cursor test...');
        
        const serverPath = path.resolve(__dirname, '..', 'index.js');
        console.log(`Server path: ${serverPath}`);
        
        this.serverProcess = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env, 
                DONT_FORGET_DATA_DIR: path.join(__dirname, '..', '..', 'test-data') 
            }
        });

        if (!this.serverProcess.stdout || !this.serverProcess.stdin || !this.serverProcess.stderr) {
            throw new Error('Failed to create server process with proper stdio');
        }

        // Log server stderr for debugging
        this.serverProcess.stderr.on('data', (data) => {
            console.log(`📊 Server stderr: ${data.toString().trim()}`);
        });

        // Log server stdout (this is where MCP responses come from)
        this.serverProcess.stdout.on('data', (data) => {
            console.log(`📥 Server stdout: ${data.toString().trim()}`);
        });

        // Wait a moment for server to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (this.serverProcess.exitCode !== null) {
            throw new Error(`Server process exited with code ${this.serverProcess.exitCode}`);
        }

        console.log('✅ Server started successfully');
    }

    private sendMessage(message: RawMessage): void {
        if (!this.serverProcess?.stdin) {
            throw new Error('Server process not available');
        }

        const messageString = JSON.stringify(message) + '\n';
        console.log(`📤 Sending: ${messageString.trim()}`);
        this.serverProcess.stdin.write(messageString);
    }

    private getNextId(): number {
        return this.messageId++;
    }

    async testInitialization(): Promise<void> {
        console.log('\n🔌 Testing MCP initialization...');
        
        // Step 1: Send initialize request (this is what MCP clients do first)
        this.sendMessage({
            jsonrpc: "2.0",
            id: this.getNextId(),
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {
                    tools: {}
                },
                clientInfo: {
                    name: "cursor-test-client",
                    version: "1.0.0"
                }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async testOfferings(): Promise<void> {
        console.log('\n🔍 Testing potential "ListOfferings" methods...');
        
        // Test various potential "offerings" related methods
        const methodsToTest = [
            "listOfferings",
            "getOfferings", 
            "offerings/list",
            "list_offerings",
            "server/capabilities",
            "capabilities",
            "discovery/offerings"
        ];

        for (const method of methodsToTest) {
            console.log(`\n🧪 Testing method: ${method}`);
            this.sendMessage({
                jsonrpc: "2.0",
                id: this.getNextId(),
                method: method,
                params: {}
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async testStandardMethods(): Promise<void> {
        console.log('\n📋 Testing standard MCP methods...');
        
        // Test standard MCP methods
        const standardMethods = [
            "tools/list",
            "resources/list", 
            "prompts/list"
        ];

        for (const method of standardMethods) {
            console.log(`\n✅ Testing method: ${method}`);
            this.sendMessage({
                jsonrpc: "2.0",
                id: this.getNextId(),
                method: method,
                params: {}
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async cleanup(): Promise<void> {
        console.log('\n🧹 Cleaning up...');
        
        if (this.serverProcess) {
            console.log('🛑 Stopping server process...');
            this.serverProcess.kill('SIGTERM');
            
            await new Promise((resolve) => {
                if (this.serverProcess) {
                    this.serverProcess.on('exit', resolve);
                    setTimeout(resolve, 3000);
                } else {
                    resolve(undefined);
                }
            });
        }
        
        console.log('✅ Cleanup completed');
    }

    async runTest(): Promise<void> {
        console.log('🧪 Starting Cursor MCP Debug Test');
        console.log('=' .repeat(60));

        try {
            await this.startServer();
            await this.testInitialization();
            await this.testOfferings();
            await this.testStandardMethods();
            
            // Give some time for final responses
            console.log('\n⏳ Waiting for final responses...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error('💥 Test failed:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the test
async function main() {
    const test = new CursorMCPTest();
    await test.runTest();
}

main().catch(console.error); 