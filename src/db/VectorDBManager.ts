import { connect, Connection } from 'vectordb';
import { pipeline } from "@xenova/transformers";
import path from 'path';
import { getLogger } from '../utils/logger.js';

export class VectorDBManager {
    private db: Connection | null = null;
    private dbPath: string;
    private available: boolean = false;

    constructor(dataDirectory: string) {
        this.dbPath = path.join(dataDirectory, 'lancedb');
    }

    async initialize(): Promise<void> {
        const logger = getLogger();
        
        try {
            logger.info('Initializing vector database', { path: this.dbPath });
            this.db = await connect(this.dbPath);
            await this.createTables();
            this.available = true;
            logger.info('Vector database initialized successfully', { path: this.dbPath });
            
            // Wait for tables to be fully created
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            this.available = false;
            logger.warn('Vector database initialization failed', { 
                path: this.dbPath,
                error: error instanceof Error ? error.message : error 
            });
            this.db = null;
            // Don't throw - allow graceful degradation
        }
    }

    async createTables(): Promise<void> {
        if (!this.db) return;

        try {
            // Create changes table
            await this.db.createTable('changes', [
                { id: 1, summary: 'init', detailed_description: 'init', components: 'init', vector: new Array(384).fill(0) }
            ]);
        } catch (error) {
            // Table might already exist, ignore
        }

        try {
            // Create problems table  
            await this.db.createTable('problems', [
                { id: 1, summary: 'init', correct_action: 'init', components: 'init', vector: new Array(384).fill(0) }
            ]);
        } catch (error) {
            // Table might already exist, ignore
        }
    }

    async getDatabase(): Promise<Connection | null> {
        return this.db;
    }

    async isAvailable(): Promise<boolean> {
        return this.available;
    }

    async storeChange(summary: string, detailedDescription: string, components: string[]): Promise<void> {
        if (!this.db) {
            throw new Error('Vector database not initialized');
        }

        const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const embedding = await embedder(summary, { pooling: 'mean', normalize: true });
        const vectorArray = Array.from(embedding.data);
        
        const changesTable = await this.db.openTable('changes');
        await changesTable.add([{
            summary,
            detailed_description: detailedDescription,
            components: components.join(', '),
            vector: vectorArray
        }]);
    }

    async storeProblem(summary: string, correctAction: string, components: string[]): Promise<void> {
        if (!this.db) {
            throw new Error('Vector database not initialized');
        }

        const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const embedding = await embedder(summary, { pooling: 'mean', normalize: true });
        const vectorArray = Array.from(embedding.data);
        
        const problemsTable = await this.db.openTable('problems');
        await problemsTable.add([{
            summary,
            correct_action: correctAction,
            components: components.join(', '),
            vector: vectorArray
        }]);
    }

    async searchByVector(taskSummary: string): Promise<{
        changes: Array<{ id?: number, summary: string, detailedDescription?: string, components: string }>,
        problems: Array<{ id?: number, summary: string, correctAction?: string, components: string }>
    }> {
        if (!this.db) {
            return { changes: [], problems: [] };
        }

        const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const taskEmbedding = await embedder(taskSummary, { pooling: 'mean', normalize: true });
        const vectorArray = Array.from(taskEmbedding.data);
        
        if (vectorArray.length !== 384) {
            throw new Error(`Expected 384-dimensional vector, got ${vectorArray.length}`);
        }

        const results: {
            changes: Array<{ id?: number, summary: string, detailedDescription?: string, components: string }>,
            problems: Array<{ id?: number, summary: string, correctAction?: string, components: string }>
        } = { changes: [], problems: [] };

        try {
            const changesTable = await this.db.openTable('changes');
            const changeResults = await changesTable.search(vectorArray).limit(5).execute();
            results.changes = changeResults
                .filter((result: any) => result.summary !== 'init')
                .map((result: any) => ({
                    summary: result.summary,
                    detailedDescription: result.detailed_description,
                    components: result.components
                }));
        } catch (error) {
            // Changes table might not exist
        }

        try {
            const problemsTable = await this.db.openTable('problems');
            const problemResults = await problemsTable.search(vectorArray).limit(5).execute();
            results.problems = problemResults
                .filter((result: any) => result.summary !== 'init')
                .map((result: any) => ({
                    summary: result.summary,
                    correctAction: result.correct_action,
                    components: result.components
                }));
        } catch (error) {
            // Problems table might not exist
        }

        return results;
    }

    async close(): Promise<void> {
        // Vector database doesn't need explicit closing
    }
} 