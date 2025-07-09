import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";

const RememberMistakeInputSchema = z.object({
    summary: z.string().describe("A concise, one-sentence summary of the mistake."),
    correctAction: z.string().describe("A concise description of the action taken to correct the mistake."),
    components: z.array(z.string()).describe("An array of strings, where each string represents a component (e.g., file path, class name, function name) involved in the mistake."),
});

class RememberMistakeTool extends MCPTool {
    name = "remember-mistake";
    description = "Records a summary of a mistake, the correct action taken, and the components involved. This helps the agent learn from past errors.";
    schema = RememberMistakeInputSchema;

    async execute(input: MCPInput): Promise<string> {
        try {
            console.log('Starting RememberMistakeTool execution...');
            
            // Use global database manager
            const databaseManager = global.databaseManager;
            if (!databaseManager) {
                throw new Error('Database manager not initialized');
            }
            
            await databaseManager.storeProblem(input.summary, input.correctAction, input.components);
            
            console.log('RememberMistakeTool execution completed successfully');
            return "Successfully remembered the mistake.";
        } catch (error) {
            console.error('Error in RememberMistakeTool:', error);
            return "Error remembering the mistake.";
        }
    }
}

export default RememberMistakeTool;
