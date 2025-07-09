import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";

const RememberChangeInputSchema = z.object({
    summary: z.string().describe("A concise, one-sentence summary of the change."),
    detailedDescription: z.string().describe("A more comprehensive text describing the change, potentially including rationale, code snippets, or design decisions."),
    components: z.array(z.string()).describe("An array of strings, where each string represents a component involved in the change."),
});

class RememberChangeTool extends MCPTool {
    name = "remember-change";
    description = "Records a summary of a completed change, a detailed description, and the components involved. This allows the agent to build a history of its successful modifications.";
    schema = RememberChangeInputSchema;

    async execute(input: MCPInput): Promise<string> {
        try {
            console.log('Starting RememberChangeTool execution...');
            
            // Use global database manager
            const databaseManager = global.databaseManager;
            if (!databaseManager) {
                throw new Error('Database manager not initialized');
            }
            
            await databaseManager.storeChange(input.summary, input.detailedDescription, input.components);
            
            console.log('RememberChangeTool execution completed successfully');
            return "Successfully remembered the change.";
        } catch (error) {
            console.error('Error in RememberChangeTool:', error);
            return "Error remembering the change.";
        }
    }
}

export default RememberChangeTool;
