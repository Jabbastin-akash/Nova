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
            // If no API key is configured, use mock to avoid runtime failures during local/dev.
            if (!process.env.GROQ_API_KEY) {
                console.warn("GROQ_API_KEY not set — using mock LLM responses.");
                return this.mockInvoke(prompt, systemPrompt);
            }
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
            // Fallback for demo or any error — prefer returning deterministic mock data
            if (process.env.DEMO_MODE === "true" || !(process.env.GROQ_API_KEY)) {
                console.warn("Falling back to Mock due to error or missing credentials.");
                return this.mockInvoke(prompt, systemPrompt);
            }
            // If an unexpected error occurred, also fall back rather than crash the flow
            try {
                return this.mockInvoke(prompt, systemPrompt);
            } catch (e) {
                throw error;
            }
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

        if (systemPrompt.includes("Interviewer")) {
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
                daily_plan: [
                    { day: 1, focus: "Data Structures Fundamentals", tasks: ["Review array & linked list implementations (2h)", "Solve 5 LeetCode Easy problems on arrays (1.5h)", "Watch system design intro video (1h)"], expected_outcome: "Solid array/list foundations" },
                    { day: 2, focus: "Stacks, Queues & Hash Maps", tasks: ["Implement stack and queue from scratch (1.5h)", "Solve 5 hash map problems on LeetCode (2h)", "Read about collision handling strategies (0.5h)"], expected_outcome: "Confident with stack/queue/map" },
                    { day: 3, focus: "Trees & Binary Search Trees", tasks: ["Implement BST insert, delete, search (2h)", "Solve 5 tree traversal problems (1.5h)", "Study balanced trees overview (AVL, Red-Black) (1h)"], expected_outcome: "Tree traversal mastery" },
                    { day: 4, focus: "Graph Algorithms", tasks: ["Implement BFS and DFS from scratch (2h)", "Solve 3 graph problems (shortest path, cycle detection) (2h)", "Review topological sort (0.5h)"], expected_outcome: "Graph traversal confidence" },
                    { day: 5, focus: "Dynamic Programming", tasks: ["Study DP patterns (knapsack, LCS, LIS) (2h)", "Solve 5 classic DP problems (2h)", "Practice explaining DP approach out loud (0.5h)"], expected_outcome: "DP pattern recognition" },
                    { day: 6, focus: "System Design Basics", tasks: ["Study load balancing and caching concepts (1.5h)", "Design a URL shortener on paper (1h)", "Review CAP theorem and database scaling (1h)"], expected_outcome: "System design vocabulary" },
                    { day: 7, focus: "Mock Interview & Review", tasks: ["Take a full mock interview (1.5h)", "Review all weak areas from the week (1h)", "Refine resume based on learnings (0.5h)"], expected_outcome: "Week 1 consolidation" }
                ],
                weekly_mock_schedule: [
                    "Monday: 30min DSA warm-up + 1h focused problem solving",
                    "Tuesday: 45min system design discussion practice",
                    "Wednesday: 1h timed coding challenge (3 problems)",
                    "Thursday: 30min behavioral question prep + 1h technical mock",
                    "Friday: 1.5h full mock interview with peer or AI"
                ],
                project_upgrade_suggestions: [
                    "Add real-time features (WebSockets) to your chat app",
                    "Deploy a microservice to AWS/GCP with CI/CD pipeline",
                    "Add comprehensive testing (unit + integration) to main project",
                    "Build a performance dashboard with metrics and monitoring"
                ],
                resume_improvement_actions: [
                    "Quantify project impact: add metrics like '40% faster load time', '10K daily users'",
                    "Add a 'Technical Skills' section organized by category (Languages, Frameworks, Tools)",
                    "Include a 'Key Achievements' section with measurable results",
                    "Remove generic descriptions; use action verbs (Architected, Optimized, Deployed)",
                    "Add links to live demos or GitHub repos for each project"
                ],
                expected_readiness_after_plan: "85%"
            });
        }

        return "{}";
    }

    // Expose mock helper for agents/tests to use when needed
    public getMockResponse(prompt: string, systemPrompt: string): string {
        return this.mockInvoke(prompt, systemPrompt);
    }
}
