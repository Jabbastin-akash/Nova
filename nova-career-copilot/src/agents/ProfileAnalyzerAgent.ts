import type { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "../memory/MemoryManager";
import { GroqClient } from "../llm/GroqClient";

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

            // Try to parse JSON robustly (some LLMs return wrapped text)
            let parsed: any;
            try {
                // Prefer balanced extraction to handle trailing or malformed content
                try {
                    const { extractJSON } = await import("../lib/utils");
                    const cleanedExtract = extractJSON(response);
                    const cleaned = cleanedExtract || (response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/) || [])[0] || response;
                    parsed = JSON.parse(cleaned);
                } catch (inner) {
                    console.error("ProfileAnalyzerAgent: Failed to parse LLM response", response, inner);
                    return { success: false, data: null, message: "LLM Processing Failed" };
                }
            } catch (e) {
                return { success: false, data: null, message: "LLM Processing Failed" };
            }

            // Normalize output - support multiple schemas
            const normalized = {
                resume_score: parsed.resume_score ?? parsed.score?.resume ?? parsed.score?.resume_score ?? undefined,
                project_depth_score: parsed.project_depth_score ?? parsed.score?.projects ?? undefined,
                technical_maturity_score: parsed.technical_maturity_score ?? parsed.score?.maturity ?? undefined,
                missing_core_areas: parsed.missing_core_areas ?? parsed.priority_gaps ?? parsed.weaknesses ?? undefined,
                inferred_strengths: parsed.inferred_strengths ?? parsed.recommendations ?? ([] as string[])
            } as any;

            // Attempt to extract strengths from skills object if present
            if ((!normalized.inferred_strengths || normalized.inferred_strengths.length === 0) && parsed.skills) {
                const skillsArr: string[] = [];
                Object.values(parsed.skills).forEach((v: any) => {
                    if (Array.isArray(v)) skillsArr.push(...v as string[]);
                });
                normalized.inferred_strengths = skillsArr;
            }

            // Update Memory with normalized values plus user inputs
            this.memory.updateProfile({
                resumeText,
                declaredSkills,
                academicYear,
                targetCompany,
                resumeScore: normalized.resume_score ?? undefined,
                projectDepthScore: normalized.project_depth_score ?? undefined,
                technicalMaturityScore: normalized.technical_maturity_score ?? undefined,
                missingCoreAreas: normalized.missing_core_areas ?? undefined,
                inferredStrengths: normalized.inferred_strengths ?? undefined
            });

            // Return normalized data for orchestrator
            return { success: true, data: { ...parsed, ...normalized } };
        } catch (error) {
            return { success: false, data: null, message: "LLM Processing Failed" };
        }
    }
}
