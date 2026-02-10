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
    Output structured JSON ONLY. Do not include any conversational text, markdown formatting, or code blocks.: { daily_plan: [], weekly_mock_schedule: [], project_upgrade_suggestions: [], resume_improvement_actions: [] }
    `;

        const userPrompt = `Generate a plan.`;

        try {
            const response = await this.llm.invoke(userPrompt, systemPrompt);

            // Try robust parsing using balanced JSON extraction
            try {
                const { extractJSON } = await import("../lib/utils");
                let cleaned = extractJSON(response) || (() => {
                    const m = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                    return m ? m[0] : response;
                })();

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
