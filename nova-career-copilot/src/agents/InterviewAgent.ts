import type { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "../memory/MemoryManager";
import { GroqClient } from "../llm/GroqClient";

export class InterviewAgent implements Agent {
    name = "InterviewAgent";
    private llm: GroqClient;
    private memory: MemoryManager;

    constructor() {
        this.llm = new GroqClient();
        this.memory = MemoryManager.getInstance();
    }

    async process(input: AgentInput): Promise<AgentOutput> {
        const state = this.memory.getState();
        const weakAreas = state.weakAreas?.length > 0 ? state.weakAreas : ["general programming", "problem solving"];
        const company = state.targetCompany?.name || state.studentProfile?.targetCompany || "General";
        const skills = state.studentProfile?.declaredSkills || [];

        // input.data can contain the user's answer to the previous question
        const { lastAnswer, lastQuestionId, difficulty } = input.data || {};

        const difficultyLevel = difficulty || "Medium";

        const systemPrompt = `You are an AI Technical Interviewer for ${company}.
You are conducting an adaptive mock interview to help the candidate prepare.
Candidate's weak areas: ${weakAreas.join(", ")}
Candidate's skills: ${skills.join(", ")}
Difficulty level: ${difficultyLevel}

Your task:
${lastAnswer ?
                "1. Evaluate the candidate's answer (score 1-10 for technical depth, clarity, structure)\n2. Provide brief constructive feedback\n3. Generate a follow-up or new question" :
                "Generate a technical interview question appropriate for the difficulty level and targeting the weak areas."}

CRITICAL: Output ONLY valid JSON. No markdown, no code blocks, no extra text.
JSON format:
{
  "question": "The interview question to ask",
  "difficulty": "${difficultyLevel}",
  "topic": "The topic area this question covers",
  "evaluation": ${lastAnswer ? '{"technical_depth": 1-10, "clarity": 1-10, "structure": 1-10}' : 'null'},
  "feedback_summary": ${lastAnswer ? '"Brief feedback on the answer"' : 'null'}
}`;

        let userPrompt = `Generate a ${difficultyLevel} difficulty interview question targeting these areas: ${weakAreas.join(", ")}.`;

        if (lastAnswer) {
            userPrompt = `The candidate answered: "${lastAnswer}"

Evaluate their answer and then generate the next question.`;
        }

        try {
            const response = await this.llm.invoke(userPrompt, systemPrompt);

            // Clean any markdown formatting from the response
            let cleanedResponse = response.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.slice(7);
            }
            if (cleanedResponse.startsWith("```")) {
                cleanedResponse = cleanedResponse.slice(3);
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.slice(0, -3);
            }
            cleanedResponse = cleanedResponse.trim();

            const parsed = JSON.parse(cleanedResponse);

            // If this was an evaluation, store result
            if (lastAnswer && parsed.evaluation) {
                this.memory.addInterviewResult({
                    id: Date.now().toString(),
                    question: lastQuestionId || "Previous question",
                    topic: parsed.topic || "Unknown",
                    answer: lastAnswer,
                    evaluation: {
                        technicalDepth: parsed.evaluation.technical_depth,
                        clarity: parsed.evaluation.clarity,
                        structure: parsed.evaluation.structure
                    },
                    feedback: parsed.feedback_summary || "",
                    timestamp: new Date()
                });
            }

            return { success: true, data: parsed };
        } catch (error: any) {
            console.error("InterviewAgent Error:", error);
            // Return a fallback question if LLM fails
            return {
                success: true,
                data: {
                    question: "Tell me about a challenging technical problem you've solved recently. What was your approach?",
                    difficulty: difficultyLevel,
                    topic: "Problem Solving",
                    evaluation: null,
                    feedback_summary: null
                }
            };
        }
    }
}
