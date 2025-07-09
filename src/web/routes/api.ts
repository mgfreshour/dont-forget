import { Router } from 'express';
import { DatabaseManager } from '../../db/DatabaseManager.js';
import RememberChangeTool from '../../tools/RememberChangeTool.js';
import RememberMistakeTool from '../../tools/RememberMistakeTool.js';
import GetPotentialContextTool from '../../tools/GetPotentialContextTool.js';
import ChangeDetailsTool from '../../tools/ChangeDetailsTool.js';
import ProblemDetailsTool from '../../tools/ProblemDetailsTool.js';
import GetComponentHistoryTool from '../../tools/GetComponentHistoryTool.js';

export function createApiRoutes(databaseManager: DatabaseManager): Router {
    const router = Router();

    // Database browsing endpoints
    router.get('/changes', async (req, res) => {
        try {
            const sqliteManager = await databaseManager.getSQLiteManager();
            const changes = await sqliteManager.getAllChanges();
            res.json(changes);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch changes', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.get('/problems', async (req, res) => {
        try {
            const sqliteManager = await databaseManager.getSQLiteManager();
            const problems = await sqliteManager.getAllProblems();
            res.json(problems);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch problems', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.get('/changes/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const change = await databaseManager.getChangeById(id);
            if (change) {
                res.json(change);
            } else {
                res.status(404).json({ error: 'Change not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch change', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.get('/problems/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const problem = await databaseManager.getProblemById(id);
            if (problem) {
                res.json(problem);
            } else {
                res.status(404).json({ error: 'Problem not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch problem', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.get('/components', async (req, res) => {
        try {
            const sqliteManager = await databaseManager.getSQLiteManager();
            const components = await sqliteManager.getAllComponents();
            res.json(components);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch components', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.get('/components/:name/history', async (req, res) => {
        try {
            const componentName = req.params.name;
            const history = await databaseManager.getComponentHistory(componentName);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch component history', details: error instanceof Error ? error.message : String(error) });
        }
    });

    // Tool execution endpoints
    router.post('/tools/remember-change', async (req, res) => {
        try {
            const tool = new RememberChangeTool();
            const result = await tool.execute(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute remember-change tool', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.post('/tools/remember-mistake', async (req, res) => {
        try {
            const tool = new RememberMistakeTool();
            const result = await tool.execute(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute remember-mistake tool', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.post('/tools/get-potential-context', async (req, res) => {
        try {
            const tool = new GetPotentialContextTool();
            const result = await tool.execute(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute get-potential-context tool', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.post('/tools/change-details/:id', async (req, res) => {
        try {
            const tool = new ChangeDetailsTool();
            const result = await tool.execute({ id: parseInt(req.params.id) });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute change-details tool', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.post('/tools/problem-details/:id', async (req, res) => {
        try {
            const tool = new ProblemDetailsTool();
            const result = await tool.execute({ id: parseInt(req.params.id) });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute problem-details tool', details: error instanceof Error ? error.message : String(error) });
        }
    });

    router.post('/tools/component-history', async (req, res) => {
        try {
            const tool = new GetComponentHistoryTool();
            const result = await tool.execute(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute component-history tool', details: error instanceof Error ? error.message : String(error) });
        }
    });

    // Search endpoint
    router.post('/search', async (req, res) => {
        try {
            const { taskSummary, componentsOfInterest } = req.body;
            const result = await databaseManager.searchContext(taskSummary, componentsOfInterest || []);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to search context', details: error instanceof Error ? error.message : String(error) });
        }
    });

    return router;
} 