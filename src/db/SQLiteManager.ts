import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { getLogger } from '../utils/logger.js';

export class SQLiteManager {
    private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
    private dbPath: string;

    constructor(dataDirectory: string) {
        this.dbPath = path.join(dataDirectory, 'database.db');
    }

    async initialize(): Promise<void> {
        const logger = getLogger();
        logger.info('Initializing SQLite database', { path: this.dbPath });
        
        this.db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });

        // Create tables if they don't exist
        await this.createTables();
        logger.info('SQLite database initialized successfully', { path: this.dbPath });
    }

    private async createTables(): Promise<void> {
        if (!this.db) {
            throw new Error('SQLite database not initialized');
        }

        // Create tables if they don't exist
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                summary TEXT NOT NULL,
                correct_action TEXT NOT NULL,
                full_context TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS problem_components (
                problem_id INTEGER NOT NULL,
                component_id INTEGER NOT NULL,
                PRIMARY KEY (problem_id, component_id),
                FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
                FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
            );
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                summary TEXT NOT NULL,
                detailed_description TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS change_components (
                change_id INTEGER NOT NULL,
                component_id INTEGER NOT NULL,
                PRIMARY KEY (change_id, component_id),
                FOREIGN KEY (change_id) REFERENCES changes(id) ON DELETE CASCADE,
                FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
            );
        `);
    }

    async getDatabase(): Promise<Database> {
        if (!this.db) {
            throw new Error('SQLite database not initialized');
        }
        return this.db;
    }

    async storeChange(summary: string, detailedDescription: string, components: string[]): Promise<void> {
        const db = await this.getDatabase();
        
        // Store in SQLite database
        const result = await db.run('INSERT INTO changes (summary, detailed_description) VALUES (?, ?)', summary, detailedDescription);
        const changeId = result.lastID;

        // Store component relationships
        for (const componentName of components) {
            let component = await db.get('SELECT id FROM components WHERE name = ?', componentName);
            if (!component) {
                const res = await db.run('INSERT INTO components (name) VALUES (?)', componentName);
                component = { id: res.lastID };
            }
            await db.run('INSERT INTO change_components (change_id, component_id) VALUES (?, ?)', changeId, component.id);
        }
    }

    async storeProblem(summary: string, correctAction: string, components: string[]): Promise<void> {
        const db = await this.getDatabase();
        
        // Store in SQLite database
        const result = await db.run('INSERT INTO problems (summary, correct_action) VALUES (?, ?)', summary, correctAction);
        const problemId = result.lastID;

        // Store component relationships
        for (const componentName of components) {
            let component = await db.get('SELECT id FROM components WHERE name = ?', componentName);
            if (!component) {
                const res = await db.run('INSERT INTO components (name) VALUES (?)', componentName);
                component = { id: res.lastID };
            }
            await db.run('INSERT INTO problem_components (problem_id, component_id) VALUES (?, ?)', problemId, component.id);
        }
    }

    async searchChangesByComponents(componentsOfInterest: string[]): Promise<any[]> {
        const db = await this.getDatabase();
        
        if (componentsOfInterest.length === 0) {
            return [];
        }

        // Search for changes with matching components
        const changeResults = await db.all(`
            SELECT c.*, GROUP_CONCAT(comp.name) as components 
            FROM changes c 
            LEFT JOIN change_components cc ON c.id = cc.change_id 
            LEFT JOIN components comp ON cc.component_id = comp.id 
            WHERE comp.name IN (${componentsOfInterest.map(() => '?').join(',')}) 
            GROUP BY c.id 
            ORDER BY c.timestamp DESC 
            LIMIT 5
        `, componentsOfInterest);

        return changeResults;
    }

    async searchProblemsByComponents(componentsOfInterest: string[]): Promise<any[]> {
        const db = await this.getDatabase();
        
        if (componentsOfInterest.length === 0) {
            return [];
        }

        // Search for problems with matching components
        const problemResults = await db.all(`
            SELECT p.*, GROUP_CONCAT(comp.name) as components 
            FROM problems p 
            LEFT JOIN problem_components pc ON p.id = pc.problem_id 
            LEFT JOIN components comp ON pc.component_id = comp.id 
            WHERE comp.name IN (${componentsOfInterest.map(() => '?').join(',')}) 
            GROUP BY p.id 
            ORDER BY p.timestamp DESC 
            LIMIT 5
        `, componentsOfInterest);

        return problemResults;
    }

    async getChangeById(id: number): Promise<any> {
        const db = await this.getDatabase();
        
        const result = await db.get(`
            SELECT c.*, GROUP_CONCAT(comp.name) as components 
            FROM changes c 
            LEFT JOIN change_components cc ON c.id = cc.change_id 
            LEFT JOIN components comp ON cc.component_id = comp.id 
            WHERE c.id = ? 
            GROUP BY c.id
        `, id);

        return result;
    }

    async getProblemById(id: number): Promise<any> {
        const db = await this.getDatabase();
        
        const result = await db.get(`
            SELECT p.*, GROUP_CONCAT(comp.name) as components 
            FROM problems p 
            LEFT JOIN problem_components pc ON p.id = pc.problem_id 
            LEFT JOIN components comp ON pc.component_id = comp.id 
            WHERE p.id = ? 
            GROUP BY p.id
        `, id);

        return result;
    }

    async getChangesByComponent(componentName: string): Promise<any[]> {
        const db = await this.getDatabase();
        
        const results = await db.all(`
            SELECT c.id, c.summary, c.timestamp
            FROM changes c 
            JOIN change_components cc ON c.id = cc.change_id 
            JOIN components comp ON cc.component_id = comp.id 
            WHERE comp.name = ? 
            ORDER BY c.timestamp DESC
        `, componentName);

        return results;
    }

    async getProblemsByComponent(componentName: string): Promise<any[]> {
        const db = await this.getDatabase();
        
        const results = await db.all(`
            SELECT p.id, p.summary, p.timestamp
            FROM problems p 
            JOIN problem_components pc ON p.id = pc.problem_id 
            JOIN components comp ON pc.component_id = comp.id 
            WHERE comp.name = ? 
            ORDER BY p.timestamp DESC
        `, componentName);

        return results;
    }

    async getAllChanges(): Promise<any[]> {
        const db = await this.getDatabase();
        
        const results = await db.all(`
            SELECT c.*, GROUP_CONCAT(comp.name) as components 
            FROM changes c 
            LEFT JOIN change_components cc ON c.id = cc.change_id 
            LEFT JOIN components comp ON cc.component_id = comp.id 
            GROUP BY c.id 
            ORDER BY c.timestamp DESC
        `);

        return results;
    }

    async getAllProblems(): Promise<any[]> {
        const db = await this.getDatabase();
        
        const results = await db.all(`
            SELECT p.*, GROUP_CONCAT(comp.name) as components 
            FROM problems p 
            LEFT JOIN problem_components pc ON p.id = pc.problem_id 
            LEFT JOIN components comp ON pc.component_id = comp.id 
            GROUP BY p.id 
            ORDER BY p.timestamp DESC
        `);

        return results;
    }

    async getAllComponents(): Promise<any[]> {
        const db = await this.getDatabase();
        
        const results = await db.all(`
            SELECT name, 
                   (SELECT COUNT(*) FROM change_components cc JOIN changes c ON cc.change_id = c.id WHERE cc.component_id = comp.id) as change_count,
                   (SELECT COUNT(*) FROM problem_components pc JOIN problems p ON pc.problem_id = p.id WHERE pc.component_id = comp.id) as problem_count
            FROM components comp 
            ORDER BY name
        `);

        return results;
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
} 