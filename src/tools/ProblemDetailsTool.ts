import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";
import { ProblemDetail } from "../db/DatabaseManager.js";

const ProblemDetailsInputSchema = z.object({
    id: z.string().describe("The unique identifier of the problem to retrieve details for."),
});

class ProblemDetailsTool extends MCPTool {
    name = "problem-details";
    description = "Retrieves the detailed information about a specific problem, including the mistake summary, correct action, and components involved.";
    schema = ProblemDetailsInputSchema;

    async execute(input: MCPInput): Promise<string> {
        try {
            console.log('Starting ProblemDetailsTool execution...');
            
            // Use global database manager
            const databaseManager = global.databaseManager;
            if (!databaseManager) {
                throw new Error('Database manager not initialized');
            }
            
            // Convert string ID to number
            const numericId = parseInt(input.id, 10);
            if (isNaN(numericId)) {
                return `Invalid ID "${input.id}". ID must be a number.`;
            }
            
            const problem: ProblemDetail | null = await databaseManager.getProblemById(numericId);
            
            if (!problem) {
                console.log('ProblemDetailsTool: Problem not found');
                return `Problem with ID "${input.id}" not found.`;
            }
            
            // Format the result for display
            const formattedResult = this.formatProblemDetails(problem);
            
            console.log('ProblemDetailsTool execution completed successfully');
            return formattedResult;
        } catch (error) {
            console.error('Error in ProblemDetailsTool:', error);
            return `Error retrieving problem details for ID "${input.id}".`;
        }
    }

    private formatProblemDetails(problem: ProblemDetail): string {
        let result = `**Problem Details (ID: ${problem.id})**\n\n`;
        result += `**Mistake Summary:** ${problem.summary}\n\n`;
        result += `**Correct Action:** ${problem.correctAction}\n\n`;
        result += `**Components Involved:**\n`;
        for (const component of problem.components) {
            result += `- ${component}\n`;
        }
        
        if (problem.timestamp) {
            result += `\n**Timestamp:** ${problem.timestamp}`;
        }
        
        return result;
    }
}

export default ProblemDetailsTool; 