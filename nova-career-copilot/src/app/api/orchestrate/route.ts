import { NextRequest, NextResponse } from "next/server";
import { MemoryManager } from "../../../memory/MemoryManager";
import { ProfileAnalyzerAgent } from "@/agents/ProfileAnalyzerAgent";
import { SkillGapAgent } from "@/agents/SkillGapAgent";
import { InterviewAgent } from "@/agents/InterviewAgent";
import { CareerPlannerAgent } from "@/agents/CareerPlannerAgent";
import { ReadinessEngine } from "@/scoring/ReadinessEngine";

// Instantiate agents
const agents: Record<string, any> = {
    "ProfileAnalyzerAgent": new ProfileAnalyzerAgent(),
    "SkillGapAgent": new SkillGapAgent(),
    "InterviewAgent": new InterviewAgent(),
    "CareerPlannerAgent": new CareerPlannerAgent(),
};

// Action to Agent mapping
const ACTION_TO_AGENT: Record<string, string> = {
    "ANALYZE_PROFILE": "ProfileAnalyzerAgent",
    "ANALYZE_GAPS": "SkillGapAgent",
    "START_INTERVIEW": "InterviewAgent",
    "ANSWER_QUESTION": "InterviewAgent",
    "GENERATE_PLAN": "CareerPlannerAgent",
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, ...data } = body;

        // Determine which agent to use based on explicit action
        const agentName = ACTION_TO_AGENT[action];

        if (!agentName) {
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        const agent = agents[agentName];

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 500 });
        }

        // Process with the agent
        // For interview actions, pass the full data including agentic state
        const agentInput: any = {
            type: action,
            data: data,
        };

        const output = await agent.process(agentInput);

        // If profile was analyzed, also store it in memory and calculate readiness
        if (action === "ANALYZE_PROFILE" && output.success) {
            const memory = MemoryManager.getInstance();

            // Normalize keys from agent (snake_case) to the MemoryManager expected shape (camelCase)
            const normalizedProfile: any = {
                // values from client input
                resumeText: (data as any).resumeText || undefined,
                declaredSkills: (data as any).declaredSkills || undefined,
                academicYear: (data as any).academicYear || undefined,
                targetCompany: (data as any).targetCompany || undefined,
            };

            const out = output.data || {};
            // Map possible snake_case outputs and alternate schemas
            if (out.resume_score !== undefined) normalizedProfile.resumeScore = out.resume_score;
            if (out.score?.resume !== undefined) normalizedProfile.resumeScore = out.score.resume;
            if (out.project_depth_score !== undefined) normalizedProfile.projectDepthScore = out.project_depth_score;
            if (out.score?.projects !== undefined) normalizedProfile.projectDepthScore = out.score.projects;
            if (out.technical_maturity_score !== undefined) normalizedProfile.technicalMaturityScore = out.technical_maturity_score;
            if (out.score?.maturity !== undefined) normalizedProfile.technicalMaturityScore = out.score.maturity;

            // Weaknesses / gaps mapping
            if (out.missing_core_areas !== undefined) normalizedProfile.missingCoreAreas = out.missing_core_areas;
            if (out.priority_gaps !== undefined) normalizedProfile.missingCoreAreas = out.priority_gaps;
            if (out.weaknesses !== undefined) normalizedProfile.missingCoreAreas = out.weaknesses;

            // Ensure missingCoreAreas is a flat array
            if (normalizedProfile.missingCoreAreas && !Array.isArray(normalizedProfile.missingCoreAreas)) {
                const arr: string[] = [];
                Object.values(normalizedProfile.missingCoreAreas).forEach((v: any) => {
                    if (Array.isArray(v)) arr.push(...v);
                    else if (typeof v === 'string') arr.push(v);
                });
                normalizedProfile.missingCoreAreas = arr;
            }

            // Strengths
            if (out.inferred_strengths !== undefined) normalizedProfile.inferredStrengths = out.inferred_strengths;
            if (out.recommendations !== undefined && (!normalizedProfile.inferredStrengths || normalizedProfile.inferredStrengths.length === 0)) normalizedProfile.inferredStrengths = out.recommendations;
            // If skills object present, flatten into inferredStrengths if missing
            if (!normalizedProfile.inferredStrengths || normalizedProfile.inferredStrengths.length === 0) {
                const skills = out.skills;
                if (skills && typeof skills === 'object') {
                    normalizedProfile.inferredStrengths = [];
                    Object.values(skills).forEach((v: any) => {
                        if (Array.isArray(v)) normalizedProfile.inferredStrengths.push(...v);
                    });
                }
            }

            // target company mapping
            if (out.target_company) normalizedProfile.targetCompany = out.target_company;
            if (out.targetCompany) normalizedProfile.targetCompany = out.targetCompany;

            memory.updateProfile(normalizedProfile);

            // Auto-calculate and return readiness
            const readinessScore = ReadinessEngine.calculateReadiness();
            memory.updateReadinessScore(readinessScore);
            output.data.readinessScore = readinessScore;
            output.data.studentProfile = memory.getState().studentProfile;
        }

        // For skill gap analysis, attach the data to output
        if (action === "ANALYZE_GAPS" && output.success) {
            const memory = MemoryManager.getInstance();
            output.data.skillGapData = memory.getState().skillGapData;
        }

        return NextResponse.json({
            decision: { agent: agentName, action },
            output,
            currentState: agentName
        });

    } catch (e: any) {
        console.error("Orchestrate Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
