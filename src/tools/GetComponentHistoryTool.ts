import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";
import { ComponentHistory } from "../db/DatabaseManager.js";

const GetComponentHistoryInputSchema = z.object({
    component: z.string().describe("The component (e.g., file path, class name, function name) to get history for."),
});

class GetComponentHistoryTool extends MCPTool {
    name = "get-component-history";
    description = "Retrieves the complete history of changes and problems for a specific component.";
    schema = GetComponentHistoryInputSchema;

    async execute(input: MCPInput): Promise<string> {
        try {
            console.log('Starting GetComponentHistoryTool execution...');
            
            // Use global database manager
            const databaseManager = global.databaseManager;
            if (!databaseManager) {
                throw new Error('Database manager not initialized');
            }
            
            const result: ComponentHistory = await databaseManager.getComponentHistory(input.component);
            
            // Format the results for display
            const formattedResult = this.formatHistoryResult(result);
            
            console.log('GetComponentHistoryTool execution completed successfully');
            return formattedResult;
        } catch (error) {
            console.error('Error in GetComponentHistoryTool:', error);
            return "Error getting component history.";
        }
    }

    private formatHistoryResult(history: ComponentHistory): string {
        let historyString = `History for component: ${history.componentName}\n\n`;
        
        if (history.changes.length > 0) {
            historyString += "Changes:\n";
            for (const change of history.changes) {
                historyString += `  - ${change.summary} (ID: ${change.id})`;
                if (change.timestamp) {
                    historyString += ` - ${change.timestamp}`;
                }
                historyString += `\n    Get details with tool change-details("${change.id}")\n`;
            }
            historyString += '\n';
        }

        if (history.problems.length > 0) {
            historyString += "Problems:\n";
            for (const problem of history.problems) {
                historyString += `  - ${problem.summary} (ID: ${problem.id})`;
                if (problem.timestamp) {
                    historyString += ` - ${problem.timestamp}`;
                }
                historyString += `\n    Get details with tool problem-details("${problem.id}")\n`;
            }
            historyString += '\n';
        }

        if (history.changes.length === 0 && history.problems.length === 0) {
            historyString += "No history found for this component.";
        }

        return historyString;
    }
}

export default GetComponentHistoryTool; 