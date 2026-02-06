import { MemoryManager } from "@/memory/MemoryManager";
import { ReadinessEngine } from "@/scoring/ReadinessEngine";

export class Orchestrator {
    private memory: MemoryManager;

    constructor() {
        this.memory = MemoryManager.getInstance();
    }

    public decideNextStep(): { agent: string; action: string } {
        const state = this.memory.getState();

        // 1. If no profile, run Profile Analysis
        if (!state.studentProfile) {
            this.memory.setSessionStage("PROFILE_ANALYSIS");
            return { agent: "ProfileAnalyzerAgent", action: "ANALYZE_PROFILE" };
        }

        // 2. If no skill gap data, run Skill Gap Analysis
        if (!state.skillGapData) {
            this.memory.setSessionStage("SKILL_GAP");
            return { agent: "SkillGapAgent", action: "ANALYZE_GAPS" };
        }

        // Update readiness score
        const score = ReadinessEngine.calculateReadiness();
        this.memory.updateReadinessScore(score);

        // 3. If readiness < 70 (threshold), or user explicitly wants interview, run Interview
        // For now, let's assume we loop interviews until a user stops or sufficient score?
        // User logic: "If readiness < threshold -> run Interview Agent"
        // Let's assume threshold is 70 for "Job Ready"

        // Check if we just finished an interview to avoid infinite loop without user input?
        // The Orchestrator is usually called via API. 
        // If the frontend calls "next", we check this.

        // We might need a flag or logic to break the loop and suggest Planning.
        // For this hackathon scope: If score < 70, suggest Interview.
        if (score < 70 && state.interviewHistory.length < 5) { // Cap at 5 auto-suggested interviews
            this.memory.setSessionStage("INTERVIEW");
            return { agent: "InterviewAgent", action: "START_INTERVIEW" };
        }

        // 4. Else, run Planner
        this.memory.setSessionStage("PLANNING");
        return { agent: "CareerPlannerAgent", action: "GENERATE_PLAN" };
    }
}
