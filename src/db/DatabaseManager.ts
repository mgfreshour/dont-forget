import fs from 'fs';
import { SQLiteManager } from './SQLiteManager.js';
import { VectorDBManager } from './VectorDBManager.js';
import { getLogger } from '../utils/logger.js';

export interface DatabaseConfig {
    dataDirectory: string;
}

export interface ContextResult {
    changes: Array<{
        id: number;
        summary: string;
        components: string;
        detailedDescription?: string;
    }>;
    problems: Array<{
        id: number;
        summary: string;
        components: string;
        correctAction?: string;
    }>;
}

export interface ChangeDetail {
    id: number;
    summary: string;
    detailedDescription: string;
    components: string[];
    timestamp?: string;
}

export interface ProblemDetail {
    id: number;
    summary: string;
    correctAction: string;
    components: string[];
    timestamp?: string;
}

export interface ComponentHistory {
    componentName: string;
    changes: Array<{
        id: number;
        summary: string;
        timestamp?: string;
    }>;
    problems: Array<{
        id: number;
        summary: string;
        timestamp?: string;
    }>;
}

export class DatabaseManager {
    private config: DatabaseConfig;
    private sqliteManager: SQLiteManager;
    private vectorDBManager: VectorDBManager;

    constructor(config: DatabaseConfig) {
        this.config = config;
        this.sqliteManager = new SQLiteManager(config.dataDirectory);
        this.vectorDBManager = new VectorDBManager(config.dataDirectory);
    }

    async initialize(): Promise<void> {
        const logger = getLogger();
        logger.info('Initializing databases', { directory: this.config.dataDirectory });
        
        // Create data directory if it doesn't exist
        if (!fs.existsSync(this.config.dataDirectory)) {
            fs.mkdirSync(this.config.dataDirectory, { recursive: true });
            logger.info('Created data directory', { directory: this.config.dataDirectory });
        }

        // Initialize both databases
        await this.sqliteManager.initialize();
        await this.vectorDBManager.initialize();
        
        logger.info('Database manager initialized successfully');
    }

    async getSQLiteManager(): Promise<SQLiteManager> {
        return this.sqliteManager;
    }

    async getVectorDatabase() {
        return await this.vectorDBManager.getDatabase();
    }

    async storeChange(summary: string, detailedDescription: string, components: string[]): Promise<void> {
        const logger = getLogger();
        const startTime = Date.now();
        
        // Always store in SQLite (critical storage)
        await this.sqliteManager.storeChange(summary, detailedDescription, components);
        logger.databaseOperation('Store change in SQLite', 'changes', Date.now() - startTime);
        
        // Try to store in vector database if available
        try {
            if (await this.vectorDBManager.isAvailable()) {
                await this.vectorDBManager.storeChange(summary, detailedDescription, components);
                logger.databaseOperation('Store change in vector DB', 'changes', Date.now() - startTime);
            } else {
                logger.debug('Vector database not available, skipping vector storage');
            }
        } catch (vectorError) {
            logger.warn('Failed to store change in vector database', { error: vectorError });
        }
    }

    async storeProblem(summary: string, correctAction: string, components: string[]): Promise<void> {
        const logger = getLogger();
        const startTime = Date.now();
        
        // Always store in SQLite (critical storage)
        await this.sqliteManager.storeProblem(summary, correctAction, components);
        logger.databaseOperation('Store problem in SQLite', 'problems', Date.now() - startTime);
        
        // Try to store in vector database if available
        try {
            if (await this.vectorDBManager.isAvailable()) {
                await this.vectorDBManager.storeProblem(summary, correctAction, components);
                logger.databaseOperation('Store problem in vector DB', 'problems', Date.now() - startTime);
            } else {
                logger.debug('Vector database not available, skipping vector storage');
            }
        } catch (vectorError) {
            logger.warn('Failed to store problem in vector database', { error: vectorError });
        }
    }

    async searchContext(taskSummary: string, componentsOfInterest: string[]): Promise<ContextResult> {
        const logger = getLogger();
        const startTime = Date.now();
        
        let result: ContextResult = {
            changes: [],
            problems: []
        };
        
        // Try vector-based search first
        try {
            if (await this.vectorDBManager.isAvailable()) {
                logger.debug('Attempting vector-based search', { taskSummary, components: componentsOfInterest });
                const vectorResults = await this.vectorDBManager.searchByVector(taskSummary);
                
                // Convert vector results to consistent format
                result.changes = vectorResults.changes.map(change => ({
                    id: change.id || 0,
                    summary: change.summary,
                    components: change.components,
                    detailedDescription: change.detailedDescription
                }));
                
                result.problems = vectorResults.problems.map(problem => ({
                    id: problem.id || 0,
                    summary: problem.summary,
                    components: problem.components,
                    correctAction: problem.correctAction
                }));
                
                if (result.changes.length > 0 || result.problems.length > 0) {
                    logger.performance('Vector search completed', Date.now() - startTime, { 
                        resultsCount: result.changes.length + result.problems.length 
                    });
                    return result;
                }
            }
        } catch (vectorError) {
            logger.warn('Vector search failed, falling back to SQLite search', { error: vectorError });
        }

        // Fallback to SQLite-based search
        logger.debug('Using SQLite-based search', { components: componentsOfInterest });
        const changeResults = await this.sqliteManager.searchChangesByComponents(componentsOfInterest);
        const problemResults = await this.sqliteManager.searchProblemsByComponents(componentsOfInterest);

        // Convert SQLite results to consistent format
        result.changes = changeResults.map(change => ({
            id: change.id,
            summary: change.summary,
            components: change.components || '',
            detailedDescription: change.detailed_description
        }));

        result.problems = problemResults.map(problem => ({
            id: problem.id,
            summary: problem.summary,
            components: problem.components || '',
            correctAction: problem.correct_action
        }));

        logger.performance('SQLite search completed', Date.now() - startTime, { 
            resultsCount: result.changes.length + result.problems.length 
        });

        return result;
    }

    async getChangeById(id: number): Promise<ChangeDetail | null> {
        const logger = getLogger();
        const startTime = Date.now();
        
        // Query SQLite only - details exist exclusively in SQL datastore
        const sqliteResult = await this.sqliteManager.getChangeById(id);
        if (sqliteResult) {
            logger.databaseOperation('Get change by ID', 'changes', Date.now() - startTime);
            return {
                id: sqliteResult.id,
                summary: sqliteResult.summary,
                detailedDescription: sqliteResult.detailed_description || '',
                components: sqliteResult.components ? sqliteResult.components.split(', ') : [],
                timestamp: sqliteResult.timestamp
            };
        }

        return null;
    }

    async getProblemById(id: number): Promise<ProblemDetail | null> {
        const logger = getLogger();
        const startTime = Date.now();
        
        // Query SQLite only - details exist exclusively in SQL datastore
        const sqliteResult = await this.sqliteManager.getProblemById(id);
        if (sqliteResult) {
            logger.databaseOperation('Get problem by ID', 'problems', Date.now() - startTime);
            return {
                id: sqliteResult.id,
                summary: sqliteResult.summary,
                correctAction: sqliteResult.correct_action || '',
                components: sqliteResult.components ? sqliteResult.components.split(', ') : [],
                timestamp: sqliteResult.timestamp
            };
        }

        return null;
    }

    async getComponentHistory(componentName: string): Promise<ComponentHistory> {
        const logger = getLogger();
        const startTime = Date.now();
        
        // Query SQLite only - component history exists exclusively in SQL datastore
        const changeResults = await this.sqliteManager.getChangesByComponent(componentName);
        const problemResults = await this.sqliteManager.getProblemsByComponent(componentName);

        logger.performance('Get component history', Date.now() - startTime, { 
            component: componentName,
            changesCount: changeResults.length,
            problemsCount: problemResults.length
        });

        return {
            componentName,
            changes: changeResults.map((change: any) => ({
                id: change.id,
                summary: change.summary,
                timestamp: change.timestamp
            })),
            problems: problemResults.map((problem: any) => ({
                id: problem.id,
                summary: problem.summary,
                timestamp: problem.timestamp
            }))
        };
    }

    async close(): Promise<void> {
        const logger = getLogger();
        logger.info('Closing database connections');
        
        await this.sqliteManager.close();
        await this.vectorDBManager.close();
        
        logger.info('Database manager closed');
    }
} 