import { GroqClient } from "../src/llm/GroqClient";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testGroq() {
    console.log("Testing Groq Client...");
    console.log("API Key present:", !!process.env.GROQ_API_KEY);
    console.log("Model:", process.env.GROQ_MODEL);

    const client = new GroqClient();
    try {
        const response = await client.invoke("Say hello!", "You are a helpful assistant.");
        console.log("Response:", response);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testGroq();
