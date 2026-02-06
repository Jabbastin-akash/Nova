import { NextRequest, NextResponse } from "next/server";
import { MemoryManager } from "@/memory/MemoryManager";
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
        const output = await agent.process({
            type: action,
            data: data
        });

        // If profile was analyzed, also store it in memory and calculate readiness
        if (action === "ANALYZE_PROFILE" && output.success) {
            const memory = MemoryManager.getInstance();
            memory.updateProfile({
                ...data,
                ...output.data
            });
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
