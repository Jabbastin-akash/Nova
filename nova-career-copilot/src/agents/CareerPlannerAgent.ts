import { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "@/memory/MemoryManager";
import { GroqClient } from "@/llm/GroqClient";

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
        const { skillGapData, interviewHistory, weakAreas, targetCompany, readinessScore } = state;
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
            const parsed = JSON.parse(response);

            return { success: true, data: parsed };
        } catch (error) {
            return { success: false, data: null, message: "LLM Error" };
        }
    }
}
