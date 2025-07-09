import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";
import { ChangeDetail } from "../db/DatabaseManager.js";

const ChangeDetailsInputSchema = z.object({
    id: z.string().describe("The unique identifier of the change to retrieve details for."),
});

class ChangeDetailsTool extends MCPTool {
    name = "change-details";
    description = "Retrieves the detailed information about a specific change, including the full description and context.";
    schema = ChangeDetailsInputSchema;

    async execute(input: MCPInput): Promise<string> {
        try {
            console.log('Starting ChangeDetailsTool execution...');
            
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
            
            const change: ChangeDetail | null = await databaseManager.getChangeById(numericId);
            
            if (!change) {
                console.log('ChangeDetailsTool: Change not found');
                return `Change with ID "${input.id}" not found.`;
            }
            
            // Format the result for display
            const formattedResult = this.formatChangeDetails(change);
            
            console.log('ChangeDetailsTool execution completed successfully');
            return formattedResult;
        } catch (error) {
            console.error('Error in ChangeDetailsTool:', error);
            return `Error retrieving change details for ID "${input.id}".`;
        }
    }

    private formatChangeDetails(change: ChangeDetail): string {
        let result = `**Change Details (ID: ${change.id})**\n\n`;
        result += `**Summary:** ${change.summary}\n\n`;
        result += `**Detailed Description:**\n${change.detailedDescription}\n\n`;
        result += `**Components Involved:**\n`;
        for (const component of change.components) {
            result += `- ${component}\n`;
        }
        
        if (change.timestamp) {
            result += `\n**Timestamp:** ${change.timestamp}`;
        }
        
        return result;
    }
}

export default ChangeDetailsTool; 