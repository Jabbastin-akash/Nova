import { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "@/memory/MemoryManager";
import { GroqClient } from "@/llm/GroqClient";

export class ProfileAnalyzerAgent implements Agent {
    name = "ProfileAnalyzerAgent";
    private llm: GroqClient;
    private memory: MemoryManager;

    constructor() {
        this.llm = new GroqClient();
        this.memory = MemoryManager.getInstance();
    }

    async process(input: AgentInput): Promise<AgentOutput> {
        const { resumeText, declaredSkills, academicYear, targetCompany } = input.data;

        const systemPrompt = `You are the Profile Analyzer Agent.
    Input: Resume content, GitHub project descriptions, Declared tech stack, Academic year, Target company.
    Tasks: Extract structured skills, Score resume/projects/maturity (1-10), Detect missing fundamentals/weaknesses.
    Output structured JSON ONLY. Do not include any conversational text, markdown formatting, or code blocks.`;

        const userPrompt = `
    Resume: ${resumeText}
    Skills: ${declaredSkills.join(", ")}
    Year: ${academicYear}
    Target: ${targetCompany}
    `;

        try {
            const response = await this.llm.invoke(userPrompt, systemPrompt);
            const parsed = JSON.parse(response);

            // Update Memory
            this.memory.updateProfile({
                resumeText,
                declaredSkills,
                academicYear,
                targetCompany,
                resumeScore: parsed.resume_score,
                technicalMaturityScore: parsed.technical_maturity_score,
                missingCoreAreas: parsed.missing_core_areas,
                inferredStrengths: parsed.inferred_strengths
            });

            return { success: true, data: parsed };
        } catch (error) {
            return { success: false, data: null, message: "LLM Processing Failed" };
        }
    }
}
