import type { Agent, AgentInput, AgentOutput } from "./Agent";
import { MemoryManager } from "../memory/MemoryManager";
import { GeminiClient } from "../llm/GeminiClient";
import { GroqClient } from "../llm/GroqClient";

/**
 * Agentic Interviewer — Autonomous interview agent with dual-LLM routing.
 *
 * Internal Agent Loop (never exposed):
 * 1. Observe state (topic, difficulty, phase, questionsAsked)
 * 2. Evaluate last answer → Gemini (heavy reasoning)
 * 3. Plan next focus area
 * 4. Generate next question → Groq (fast, lightweight)
 * 5. Output ONLY the question as strict JSON
 *
 * LLM Routing:
 * - Gemini: Answer evaluation, phase transitions, weakness detection
 * - Groq: Question generation, follow-up decisions
 */

interface InterviewState {
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    phase: "warmup" | "probing" | "deep_dive";
    questionsAsked: number;
    lastUserAnswer: string | null;
    weaknessesDetected: string[];
    strengthsDetected: string[];
}

export class InterviewAgent implements Agent {
    name = "InterviewAgent";
    private gemini: GeminiClient;    // Heavy tasks
    private groq: GroqClient;       // Light tasks
    private memory: MemoryManager;

    constructor() {
        this.gemini = new GeminiClient();
        this.groq = new GroqClient();
        this.memory = MemoryManager.getInstance();
    }

    async process(input: AgentInput): Promise<AgentOutput> {
        const memState = this.memory.getState();
        const weakAreas = memState.weakAreas?.length > 0 ? memState.weakAreas : ["general programming", "problem solving"];
        const company = memState.targetCompany?.name || memState.studentProfile?.targetCompany || "General";
        const skills = memState.studentProfile?.declaredSkills || [];

        const {
            lastAnswer,
            lastQuestionId,
            difficulty = "medium",
            topics = [],
            phase: inputPhase,
            questionsAsked: inputQuestionsAsked,
        } = input.data || {};

        // Build internal interview state
        const state: InterviewState = {
            topic: topics.length > 0 ? topics.join(", ") : weakAreas.join(", "),
            difficulty: this.normalizeDifficulty(difficulty),
            phase: inputPhase || "warmup",
            questionsAsked: inputQuestionsAsked || 0,
            lastUserAnswer: lastAnswer || null,
            weaknessesDetected: [...weakAreas],
            strengthsDetected: [...(memState.strengths || [])],
        };

        try {
            let evaluation: any = null;
            let feedbackSummary: string | null = null;
            let evalResult: any = null;

            // ─── STEP 1: EVALUATE (Gemini — heavy reasoning) ───
            if (state.lastUserAnswer) {
                evalResult = await this.evaluateAnswer(state, company, skills);
                evaluation = evalResult.evaluation;
                feedbackSummary = evalResult.feedback_summary || evalResult.feedbackSummary;

                // Store interview result in memory
                if (evaluation) {
                    this.memory.addInterviewResult({
                        id: Date.now().toString(),
                        question: lastQuestionId || "Previous question",
                        topic: evalResult.topic || state.topic,
                        answer: state.lastUserAnswer,
                        evaluation: {
                            technicalDepth: evaluation.technical_depth || 0,
                            clarity: evaluation.clarity || 0,
                            structure: evaluation.structure || 0,
                        },
                        feedback: feedbackSummary || "",
                        timestamp: new Date(),
                    });
                }

                // ─── STEP 2: DECIDE PHASE TRANSITION ───
                if (evalResult.weakness_detected) {
                    // Narrow focus — probe deeper on weakness
                    state.phase = "deep_dive";
                    if (evalResult.weakness_area) {
                        state.weaknessesDetected.push(evalResult.weakness_area);
                    }
                } else if (evalResult.strength_detected) {
                    // Increase difficulty or complexity
                    state.phase = this.advancePhase(state.phase);
                    state.difficulty = this.increaseDifficulty(state.difficulty);
                }
            }

            // ─── STEP 3: GENERATE NEXT QUESTION (Groq — fast) ───
            state.questionsAsked += 1;
            const questionResult = await this.generateQuestion(state, company, skills);

            // ─── STEP 4: RETURN STRICT JSON ───
            // Extract point system fields from top-level evalResult (not nested evaluation object)
            const evalResult2 = evalResult ? {
                points_awarded: evalResult.points_awarded ?? Math.round(((evaluation?.technical_depth || 0) + (evaluation?.clarity || 0) + (evaluation?.structure || 0)) / 3),
                max_points: evalResult.max_points ?? 10,
                is_correct: evalResult.is_correct ?? ((evaluation?.technical_depth || 0) >= 5),
                what_went_wrong: evalResult.what_went_wrong ?? null,
                correct_answer: evalResult.correct_answer ?? null,
            } : null;

            return {
                success: true,
                data: {
                    question: questionResult.question,
                    difficulty: state.difficulty,
                    topic: questionResult.topic || state.topic,
                    phase: state.phase,
                    questionsAsked: state.questionsAsked,
                    evaluation,
                    feedback_summary: feedbackSummary,
                    ...(evalResult2 || {}),
                },
            };
        } catch (error: any) {
            console.error("InterviewAgent Error:", error);

            // Fallback question
            return {
                success: true,
                data: {
                    question: "Tell me about a challenging technical problem you've solved recently. What was your approach?",
                    difficulty: state.difficulty,
                    topic: "Problem Solving",
                    phase: state.phase,
                    questionsAsked: state.questionsAsked + 1,
                    evaluation: null,
                    feedback_summary: null,
                },
            };
        }
    }

    /**
     * HEAVY TASK → Gemini
     * Evaluates the user's answer with rubric-based scoring.
     */
    private async evaluateAnswer(
        state: InterviewState,
        company: string,
        skills: string[]
    ): Promise<any> {
        const systemPrompt = `You are an internal evaluation engine for a technical interview agent.
You are evaluating a candidate's answer for a ${company} interview.
Topic: ${state.topic}
Difficulty: ${state.difficulty}
Phase: ${state.phase}
Questions asked so far: ${state.questionsAsked}
Candidate skills: ${skills.join(", ")}

EVALUATE the answer. Be precise and objective.
Award points out of 10 based on correctness, depth, and quality.
Determine whether the answer is fundamentally correct or incorrect.
If the answer is wrong or has significant errors, clearly explain what went wrong and provide the correct/ideal answer.

CRITICAL: Output ONLY valid JSON. No markdown, no code blocks, no extra text.
JSON format:
{
  "evaluation": {
    "technical_depth": <1-10>,
    "clarity": <1-10>,
    "structure": <1-10>
  },
  "points_awarded": <0-10>,
  "max_points": 10,
  "is_correct": <true/false>,
  "what_went_wrong": "<specific explanation of errors in the answer, or null if correct>",
  "correct_answer": "<the ideal/correct answer if the candidate was wrong, or null if correct>",
  "weakness_detected": <true/false>,
  "weakness_area": "<specific area of weakness or null>",
  "strength_detected": <true/false>,
  "suggested_phase": "<warmup|probing|deep_dive>",
  "topic": "<topic area this answer relates to>",
  "feedback_summary": "<2-3 sentence constructive feedback>"
}`;

        const prompt = `The candidate answered: "${state.lastUserAnswer}"

Evaluate this answer.`;

        console.log("--- Evaluating answer (Gemini primary → Groq fallback) ---");

        let response: string;
        try {
            // Use Gemini for heavy evaluation tasks
            response = await this.gemini.invoke(prompt, systemPrompt);
        } catch {
            // Gemini failed — route through Groq instead
            console.log("--- Gemini unavailable, using Groq for evaluation ---");
            response = await this.groq.invoke(prompt, systemPrompt);
        }

        try {
            const parsed = JSON.parse(this.cleanJson(response));
            console.log("--- Eval result --- points:", parsed.points_awarded, "correct:", parsed.is_correct, "wrong:", parsed.what_went_wrong?.substring(0, 80));
            return parsed;
        } catch {
            console.error("Failed to parse evaluation response, using defaults");
            return {
                evaluation: { technical_depth: 5, clarity: 5, structure: 5 },
                points_awarded: 5,
                max_points: 10,
                is_correct: true,
                what_went_wrong: null,
                correct_answer: null,
                weakness_detected: false,
                strength_detected: false,
                suggested_phase: state.phase,
                feedback_summary: "Answer received.",
                topic: state.topic,
            };
        }
    }

    /**
     * LIGHT TASK → Groq
     * Generates the next interview question based on current state.
     */
    private async generateQuestion(
        state: InterviewState,
        company: string,
        skills: string[]
    ): Promise<{ question: string; topic?: string }> {
        const phaseInstructions: Record<string, string> = {
            warmup: "Ask a foundational warm-up question. Keep it accessible but relevant.",
            probing: "Ask a probing question that tests deeper understanding. Expect specific examples or implementations.",
            deep_dive: "Ask an advanced question requiring deep technical knowledge. Focus on edge cases, trade-offs, or system-level thinking.",
        };

        const systemPrompt = `You are a question generator for a technical interview agent at ${company}.
You MUST ask questions ONLY about these specific topics: ${state.topic}
Difficulty: ${state.difficulty}
Phase: ${state.phase}
Questions asked so far: ${state.questionsAsked}
Candidate skills: ${skills.join(", ")}
Weaknesses detected: ${state.weaknessesDetected.join(", ")}

${phaseInstructions[state.phase] || phaseInstructions.probing}

Rules:
- Ask EXACTLY ONE question
- The question MUST be strictly about: ${state.topic}. Do NOT ask about unrelated topics.
- No hints, feedback, or explanations
- No multiple parts
- No meta commentary
- Do NOT repeat previous questions

CRITICAL: Output ONLY valid JSON. No markdown, no code blocks.
JSON format:
{
  "question": "Your single interview question here",
  "topic": "The specific topic area"
}`;

        const prompt = `Generate the next ${state.difficulty} difficulty interview question for phase: ${state.phase}.`;

        console.log("--- Groq: Generating question ---");
        const response = await this.groq.invoke(prompt, systemPrompt);

        try {
            return JSON.parse(this.cleanJson(response));
        } catch {
            return {
                question: `Explain how you would approach designing a ${state.topic.split(",")[0].trim()} solution for a production system.`,
                topic: state.topic.split(",")[0].trim(),
            };
        }
    }

    /** Normalize difficulty string to expected enum */
    private normalizeDifficulty(d: string): "easy" | "medium" | "hard" {
        const lower = d.toLowerCase();
        if (lower === "easy") return "easy";
        if (lower === "hard") return "hard";
        return "medium";
    }

    /** Advance phase: warmup → probing → deep_dive */
    private advancePhase(current: string): "warmup" | "probing" | "deep_dive" {
        if (current === "warmup") return "probing";
        if (current === "probing") return "deep_dive";
        return "deep_dive";
    }

    /** Increase difficulty: easy → medium → hard */
    private increaseDifficulty(current: string): "easy" | "medium" | "hard" {
        if (current === "easy") return "medium";
        if (current === "medium") return "hard";
        return "hard";
    }

    /** Strip markdown fences from JSON response */
    private cleanJson(response: string): string {
        let cleaned = response.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
        if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
        return cleaned.trim();
    }
}
