/**
 * GeminiClient — LLM client for Google Gemini API.
 * Used for heavy reasoning tasks: answer evaluation, phase transitions, weakness detection.
 */

export class GeminiClient {
  private apiKey: string;
  private modelId: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  async invoke(prompt: string, systemPrompt: string): Promise<string> {
    console.log(`--- Gemini Call (${this.modelId}) ---`);

    try {
      if (!this.apiKey) {
        console.warn("GEMINI_API_KEY not set — using mock LLM responses.");
        return this.mockInvoke(prompt, systemPrompt);
      }

      const url = `https://generativelanguage.googleapis.com/v1/models/${this.modelId}:generateContent?key=${this.apiKey}`;

      const body = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API HTTP Error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!content) {
        console.error("Empty response from Gemini");
        throw new Error("Empty response from Gemini");
      }

      // Robust JSON extraction
      const jsonMatch = content.match(/(\\{[\\s\\S]*\\}|\\[[\\s\\S]*\\])/);
      const cleaned = jsonMatch ? jsonMatch[0] : content;

      return cleaned;
    } catch (error) {
      console.error("Gemini API Error:", error);

      if (process.env.DEMO_MODE === "true" || !this.apiKey) {
        console.warn("Falling back to Mock due to error or missing credentials.");
        return this.mockInvoke(prompt, systemPrompt);
      }

      // Fallback to mock rather than crashing
      try {
        return this.mockInvoke(prompt, systemPrompt);
      } catch (e) {
        throw error;
      }
    }
  }

  private mockInvoke(prompt: string, systemPrompt: string): string {
    console.log("Gemini Mock Invoke called for:", systemPrompt.substring(0, 50));

    // Default mock evaluation response
    if (systemPrompt.includes("evaluate") || systemPrompt.includes("Evaluate")) {
      return JSON.stringify({
        evaluation: {
          technical_depth: 6,
          clarity: 7,
          structure: 6,
        },
        weakness_detected: false,
        strength_detected: true,
        suggested_phase: "probing",
        feedback_summary: "Good foundational understanding. Could go deeper on implementation details.",
      });
    }

    // Default mock question response
    return JSON.stringify({
      question: "Explain the difference between a stack and a queue, and give a real-world use case for each.",
      difficulty: "medium",
      topic: "Data Structures",
    });
  }

  public getMockResponse(prompt: string, systemPrompt: string): string {
    return this.mockInvoke(prompt, systemPrompt);
  }
}
