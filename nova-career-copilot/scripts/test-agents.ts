import { ProfileAnalyzerAgent } from "../src/agents/ProfileAnalyzerAgent";
import { AgentInput } from "../src/agents/Agent";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testAgent() {
    console.log("Testing ProfileAnalyzerAgent...");

    // Check key again just in case
    if (!process.env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is missing!");
        return;
    }

    const agent = new ProfileAnalyzerAgent();
    const input: AgentInput = {
        type: "ANALYZE_PROFILE",
        data: {
            resumeText: "Experienced JavaScript developer with 5 years in React and Node.js. Built scalable web apps.",
            declaredSkills: ["React", "Node.js", "TypeScript"],
            academicYear: "Graduate",
            targetCompany: "Google"
        }
    };

    try {
        console.log("Invoking agent...");
        const result = await agent.process(input);
        console.log("Agent Result:", JSON.stringify(result, null, 2));

        if (result.success && result.data.resumeScore) {
            console.log("✅ Agent returned valid structured data.");
        } else {
            console.error("❌ Agent failed to return valid data.");
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testAgent();
