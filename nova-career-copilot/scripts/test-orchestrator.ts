import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { MemoryManager } from "../src/memory/MemoryManager.ts";
import { ProfileAnalyzerAgent } from "../src/agents/ProfileAnalyzerAgent.ts";
import { CareerPlannerAgent } from "../src/agents/CareerPlannerAgent.ts";
import { SkillGapAgent } from "../src/agents/SkillGapAgent.ts";

async function main() {
    const memory = MemoryManager.getInstance();
    memory.resetSession();

    const profileAgent = new ProfileAnalyzerAgent();
    const gapAgent = new SkillGapAgent();
    const planner = new CareerPlannerAgent();

    const profileInput = {
        type: "ANALYZE_PROFILE",
        data: {
            resumeText: "Experienced JavaScript developer with 5 years in React and Node.js. Built scalable web apps and microservices.",
            declaredSkills: ["React", "Node.js", "TypeScript"],
            academicYear: "Graduate",
            targetCompany: "Google"
        }
    } as any;

    console.log("--- Running ANALYZE_PROFILE ---");
    const profileRes = await profileAgent.process(profileInput);
    console.log("ProfileAgent Response:", JSON.stringify(profileRes, null, 2));

    // Simulate orchestrator normalization
    const normalized: any = {
        resumeText: profileInput.data.resumeText,
        declaredSkills: profileInput.data.declaredSkills,
        academicYear: profileInput.data.academicYear,
        targetCompany: profileInput.data.targetCompany
    };

    if (profileRes.success && profileRes.data) {
        const out = profileRes.data;
        if (out.resume_score !== undefined) normalized.resumeScore = out.resume_score;
        if (out.missing_core_areas !== undefined) normalized.missingCoreAreas = out.missing_core_areas;
        if (out.inferred_strengths !== undefined) normalized.inferredStrengths = out.inferred_strengths;
        if (out.technical_maturity_score !== undefined) normalized.technicalMaturityScore = out.technical_maturity_score;
    }

    memory.updateProfile(normalized);
    console.log("Memory after profile update:", JSON.stringify(memory.getState(), null, 2));

    console.log("--- Running GENERATE_PLAN ---");
    const planRes = await planner.process({ type: "GENERATE_PLAN", data: { timeHorizon: "30 days" } });
    console.log("Planner Response:", JSON.stringify(planRes, null, 2));

    console.log("Final Memory State:", JSON.stringify(memory.getState(), null, 2));
}

main().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});