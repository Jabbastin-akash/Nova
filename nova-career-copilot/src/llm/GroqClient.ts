import Groq from "groq-sdk";

export class GroqClient {
    private client: Groq;
    private modelId: string;

    constructor() {
        this.client = new Groq({
            apiKey: process.env.GROQ_API_KEY || "",
        });
        this.modelId = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    }

    async invoke(prompt: string, systemPrompt: string): Promise<string> {
        console.log(`--- Groq Call (${this.modelId}) ---`);

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                model: this.modelId,
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 0.9,
            });

            const content = completion.choices[0]?.message?.content || "";

            if (!content) {
                console.error("Unexpected Groq response structure");
                throw new Error("Empty response from Groq");
            }

            // Robust JSON extraction
            const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            const cleaned = jsonMatch ? jsonMatch[0] : content;

            return cleaned;

        } catch (error) {
            console.error("Groq API Error:", error);
            // Fallback for demo if keys are missing
            if (process.env.DEMO_MODE === "true" || (error as any).status === 401) {
                console.warn("Falling back to Mock due to error or missing credentials.");
                return this.mockInvoke(prompt, systemPrompt);
            }
            throw error;
        }
    }

    private mockInvoke(prompt: string, systemPrompt: string): string {
        console.log("Mock Invoke called for:", systemPrompt.substring(0, 50));

        if (systemPrompt.includes("Profile Analyzer")) {
            return JSON.stringify({
                skills: ["JavaScript", "React", "Node.js", "Python"],
                resume_score: 7,
                project_depth_score: 6,
                technical_maturity_score: 5,
                missing_core_areas: ["System Design", "Advanced DSA"],
                inferred_strengths: ["Frontend Development", "Scripting"],
                risk_flags: ["Lack of quantified results"]
            });
        }

        if (systemPrompt.includes("Skill Gap")) {
            return JSON.stringify({
                readiness_percentage: 65,
                priority_gaps: ["Dynamic Programming", "System Scalability"],
                secondary_gaps: ["CI/CD"],
                company_alignment_score: 60,
                critical_focus_areas: ["LeetCode Medium/Hard", "Distrubuted Systems Basics"]
            });
        }

        if (systemPrompt.includes("Interview Agent")) {
            return JSON.stringify({
                question: "How would you design a rate limiter for a high-traffic API? (Mocked)",
                difficulty: "Medium",
                evaluation: {
                    technical_depth: 0,
                    clarity: 0,
                    structure: 0
                },
                weak_topics_detected: [],
                follow_up_question: "",
                feedback_summary: "Initial question."
            });
        }

        if (systemPrompt.includes("Career Planner")) {
            return JSON.stringify({
                daily_plan: [{ day: 1, focus: "Mock Plan", tasks: ["Task A", "Task B"], expected_outcome: "Done" }],
                weekly_mock_schedule: ["Mock 1"],
                project_upgrade_suggestions: ["Upgrade X"],
                resume_improvement_actions: ["Fix Y"],
                expected_readiness_after_plan: "80%"
            });
        }

        return "{}";
    }
}
