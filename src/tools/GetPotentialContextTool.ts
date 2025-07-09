import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";
import { ContextResult } from "../db/DatabaseManager.js";

const GetPotentialContextInputSchema = z.object({
    taskSummary: z.string().describe("A concise summary of the current task the agent is about to undertake."),
    componentsOfInterest: z.array(z.string()).describe("An array of strings, representing components that are likely to be affected by or relevant to the current task."),
});

class GetPotentialContextTool extends MCPTool {
    name = "get-potential-context";
    description = "Retrieves relevant past problems and changes based on a task summary and components of interest, providing historical context to the agent.";
    schema = GetPotentialContextInputSchema;

    async execute(input: MCPInput): Promise<string> {
        try {
            console.log('Starting GetPotentialContextTool execution...');
            
            // Use global database manager
            const databaseManager = global.databaseManager;
            if (!databaseManager) {
                throw new Error('Database manager not initialized');
            }
            
            const result: ContextResult = await databaseManager.searchContext(input.taskSummary, input.componentsOfInterest);
            
            // Format the results for display
            const formattedResult = this.formatContextResult(result);
            
            console.log('GetPotentialContextTool execution completed successfully');
            return formattedResult;
        } catch (error) {
            console.error('Error in GetPotentialContextTool:', error);
            return "Error getting potential context.";
        }
    }

    private formatContextResult(result: ContextResult): string {
        let contextString = "";
        
        if (result.changes.length > 0) {
            contextString += "- Previous changes:\n";
            for (const change of result.changes) {
                contextString += `  - ${change.summary}. Components: ${change.components}. Get more details with tool change-details(${change.id})\n`;
            }
        }

        if (result.problems.length > 0) {
            contextString += "- Problems:\n";
            for (const problem of result.problems) {
                contextString += `  - ${problem.summary}. Components: ${problem.components}. Get more details with tool problem-details(${problem.id})\n`;
            }
        }

        return contextString.length > 0 ? contextString : "No relevant context found.";
    }
}

export default GetPotentialContextTool;
