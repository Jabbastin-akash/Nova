import type { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "../memory/MemoryManager";
import { GroqClient } from "../llm/GroqClient";

export class CareerPlannerAgent implements Agent {
    name = "CareerPlannerAgent";
    private llm: GroqClient;
    private memory: MemoryManager;

    constructor() {
        this.llm = new GroqClient();
        this.memory = MemoryManager.getInstance();
    }

    async process(input: AgentInput): Promise<AgentOutput> {
        const state = this.memory.getState();
        const { skillGapData, interviewHistory, targetCompany, readinessScore } = state;
        let weakAreas: string[] = [];
        if (Array.isArray(state.weakAreas)) {
            weakAreas = state.weakAreas as string[];
        } else if (state.weakAreas && typeof state.weakAreas === 'object') {
            Object.values(state.weakAreas).forEach((v: any) => {
                if (Array.isArray(v)) weakAreas.push(...v);
                else if (typeof v === 'string') weakAreas.push(v);
            });
        }
        if (weakAreas.length === 0) weakAreas = ["general programming", "problem solving"];
        const { timeHorizon } = input.data || { timeHorizon: "30 days" };

        const systemPrompt = `You are the Career Planner Agent.
Goal: Generate a company-oriented career improvement roadmap.
Company: ${targetCompany?.name}
Time Horizon: ${timeHorizon}
Current Readiness: ${readinessScore}
Weak Areas: ${weakAreas.join(", ")}

CRITICAL: Output ONLY valid JSON. No markdown, no code blocks, no extra text.
All property names and string values MUST be in double quotes.
Numbers like "2-5" must be strings: "day": "2-5" NOT "day": 2-5

JSON Schema:
{
  "daily_plan": [
    {
      "day": <number or string like "1" or "2-5">,
      "focus": "<topic>",
      "tasks": ["<task 1>", "<task 2>"],
      "expected_outcome": "<outcome>"
    }
  ],
  "weekly_mock_schedule": ["<schedule item 1>", "<schedule item 2>"],
  "project_upgrade_suggestions": ["<suggestion 1>", "<suggestion 2>"],
  "resume_improvement_actions": ["<action 1>", "<action 2>"],
  "expected_readiness_after_plan": "<percentage>"
}`;

        const userPrompt = `Generate a plan.`;

        try {
            const response = await this.llm.invoke(userPrompt, systemPrompt);

            // Try robust parsing using balanced JSON extraction
            try {
                let cleaned = response.trim();

                // Remove markdown code blocks
                if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
                if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
                if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
                cleaned = cleaned.trim();

                // Extract JSON object/array
                const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (jsonMatch) cleaned = jsonMatch[0];

                // Fix common JSON errors: unquoted numeric ranges
                // "day": 16-20 -> "day": "16-20"
                // "week": 2-5 -> "week": "2-5"
                cleaned = cleaned.replace(/"(day|week)":\s*(\d+)-(\d+)/g, '"$1": "$2-$3"');

                // Also handle edge case where there's no space: "day":16-20
                cleaned = cleaned.replace(/"(day|week)":(\d+)-(\d+)/g, '"$1": "$2-$3"');

                const parsed = JSON.parse(cleaned);
                return { success: true, data: parsed };
            } catch (e) {
                console.error("CareerPlannerAgent: JSON parse failed for response:", response, e);
                // Fallback to mock response
                try {
                    const mock = (this.llm as any).getMockResponse(userPrompt, systemPrompt);
                    const parsedMock = JSON.parse(mock);
                    return { success: true, data: parsedMock };
                } catch (me) {
                    console.error("CareerPlannerAgent: Mock parse failed:", me);
                    return { success: false, data: null, message: "LLM Error" };
                }
            }
        } catch (error) {
            return { success: false, data: null, message: "LLM Error" };
        }
    }
}
