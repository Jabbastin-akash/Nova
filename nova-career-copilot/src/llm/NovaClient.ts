import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export class NovaClient {
    private client: BedrockRuntimeClient;
    private modelId: string;

    constructor() {
        this.client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        });
        // User requested "Amazon Nova 2", mapping to likely available ID "amazon.nova-lite-v1:0" or similar.
        // Adjust this ID to the exact one provided by AWS for "Nova 2" if different.
        this.modelId = process.env.AMAZON_NOVA_MODEL_ID || "amazon.nova-lite-v1:0";
    }

    async invoke(prompt: string, systemPrompt: string): Promise<string> {
        console.log(`--- AWS Bedrock Call (${this.modelId}) ---`);

        // Amazon Nova uses the Messages API structure
        const payload = {
            messages: [
                {
                    role: "user",
                    content: [
                        { text: prompt }
                    ]
                }
            ],
            system: [
                { text: systemPrompt }
            ],
            inferenceConfig: {
                max_new_tokens: 2000,
                temperature: 0.7,
                top_p: 0.9,
            }
        };

        try {
            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(payload),
            });

            const response = await this.client.send(command);
            const responseBody = new TextDecoder().decode(response.body);
            const parsed = JSON.parse(responseBody);

            // Nova response structure
            // Typically: { output: { message: { content: [ { text: "..." } ] } } }
            const outputText = parsed.output?.message?.content?.[0]?.text;

            if (!outputText) {
                console.error("Unexpected Nova response structure:", responseBody);
                throw new Error("Empty response from Nova");
            }

            // Try to clean markdown code blocks if present (JSON often wrapped in ```json ... ```)
            const cleaned = outputText.replace(/```json\n?|```/g, "").trim();

            return cleaned;

        } catch (error) {
            console.error("AWS Bedrock Error:", error);
            // Fallback for demo if keys are missing
            if (process.env.DEMO_MODE === "true" || (error as any).name === "CredentialsProviderError") {
                console.warn("Falling back to Mock due to missing credentials.");
                return this.mockInvoke(prompt, systemPrompt);
            }
            throw error;
        }
    }

    private mockInvoke(prompt: string, systemPrompt: string): string {
        // ... (Keep previous mock logic for safety/fallback) ...
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
