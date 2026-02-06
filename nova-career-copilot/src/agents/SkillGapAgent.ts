import { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "@/memory/MemoryManager";
import { NovaClient } from "@/llm/NovaClient";
import { companyProfiles } from "@/config/companyProfiles";

export class SkillGapAgent implements Agent {
    name = "SkillGapAgent";
    private llm: NovaClient;
    private memory: MemoryManager;

    constructor() {
        this.llm = new NovaClient();
        this.memory = MemoryManager.getInstance();
    }

    async process(input: AgentInput): Promise<AgentOutput> {
        const state = this.memory.getState();
        const profile = state.studentProfile;
        const company = state.targetCompany;

        if (!profile || !company) {
            return { success: false, data: null, message: "Missing Profile or Target Company" };
        }

        const systemPrompt = `You are the Skill Gap Analyzer Agent.
    Goal: Compare student skill profile against company expectations.
    Company: ${company.name}
    Expectations: ${company.focusAreas.join(", ")}
    Weights: Tech ${company.technicalWeight}, Behav ${company.behavioralWeight}
    
    Output structured JSON with readiness_percentage, priority_gaps, etc.`;

        const userPrompt = `
    Student Skills: ${JSON.stringify(profile)}
    `;

        try {
            const response = await this.llm.invoke(userPrompt, systemPrompt);
            const parsed = JSON.parse(response);

            this.memory.updateSkillGap({
                readinessPercentage: parsed.readiness_percentage,
                priorityGaps: parsed.priority_gaps,
                secondaryGaps: parsed.secondary_gaps,
                alignmentScore: parsed.company_alignment_score
            });

            return { success: true, data: parsed };
        } catch (error) {
            return { success: false, data: null, message: "LLM Error" };
        }
    }
}
