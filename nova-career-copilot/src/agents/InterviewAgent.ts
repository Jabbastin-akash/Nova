import { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "@/memory/MemoryManager";
import { NovaClient } from "@/llm/NovaClient";

export class InterviewAgent implements Agent {
    name = "InterviewAgent";
    private llm: NovaClient;
    private memory: MemoryManager;

    constructor() {
        this.llm = new NovaClient();
        this.memory = MemoryManager.getInstance();
    }

    async process(input: AgentInput): Promise<AgentOutput> {
        const state = this.memory.getState();
        const weakAreas = state.weakAreas;
        const company = state.targetCompany;

        // input.data can contain the user's answer to the previous question
        const { lastAnswer, lastQuestionId } = input.data || {};

        const systemPrompt = `You are the Interview Agent.
    Goal: Simulate adaptive company-specific interviews.
    Company: ${company?.name || "General"}
    Weak Areas: ${weakAreas.join(", ")}
    Structure: Generate 1 technical question or evaluate answer.
    Output structured JSON: { question, difficulty, evaluation: { technical_depth, clarity, structure }, feedback_summary }
    `;

        let userPrompt = "Generate a new question based on my weak areas.";
        if (lastAnswer) {
            userPrompt = `Evaluate this answer to the previous question. Then generate the next question (or follow-up).
        Previous Question ID: ${lastQuestionId}
        Answer: ${lastAnswer}
        `;
        }

        try {
            const response = await this.llm.invoke(userPrompt, systemPrompt);
            const parsed = JSON.parse(response);

            // If this was an evaluation, store result
            if (lastAnswer) {
                this.memory.addInterviewResult({
                    id: Date.now().toString(),
                    question: "Previous Question Placeholder", // Ideally passes the Q text too
                    topic: "Determined by LLM",
                    answer: lastAnswer,
                    evaluation: parsed.evaluation,
                    feedback: parsed.feedback_summary,
                    timestamp: new Date()
                });
            }

            return { success: true, data: parsed };
        } catch (error) {
            return { success: false, data: null, message: "LLM Error" };
        }
    }
}
