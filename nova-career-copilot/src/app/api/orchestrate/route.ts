import { NextRequest, NextResponse } from "next/server";
import { Orchestrator } from "@/orchestrator/Orchestrator";
import { ProfileAnalyzerAgent } from "@/agents/ProfileAnalyzerAgent";
import { SkillGapAgent } from "@/agents/SkillGapAgent";
import { InterviewAgent } from "@/agents/InterviewAgent";
import { CareerPlannerAgent } from "@/agents/CareerPlannerAgent";

const orchestrator = new Orchestrator();
// Instantiate agents (singleton-ish or per request?)
// Agents are stateless classes effectively if MemoryManager is singleton.
const agents: Record<string, any> = {
    "ProfileAnalyzerAgent": new ProfileAnalyzerAgent(),
    "SkillGapAgent": new SkillGapAgent(),
    "InterviewAgent": new InterviewAgent(),
    "CareerPlannerAgent": new CareerPlannerAgent(),
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Frontend sends "action" or "current_input"
        // Ask Orchestrator what to do
        const decision = orchestrator.decideNextStep();

        // If the user is explicitly forcing an action (e.g. sending resume), we might override
        // But for "Agentic" flow, we trust the orchestrator or state.
        // However, if we need input (e.g. Resume), the Orchestrator expects us to call the agent.

        const agentName = decision.agent;
        const agent = agents[agentName];

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 500 });
        }

        // Agent Process
        const output = await agent.process({
            type: decision.action,
            data: body // Pass frontend input (e.g. text answer, resume content)
        });

        return NextResponse.json({
            decision,
            output,
            currentState: agentName // Tell UI which view to show
        });

    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
