import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const QualifyingResultSchema = z.object({
  extracted: z.record(z.string(), z.string().nullable().optional()),
  missingQuestions: z.array(z.string()),
  classification: z.enum(["hot", "cold", "invalid", "pending"]),
  reasoning: z.string(),
  nextQuestion: z.string().optional(),
});

interface LeadLLMOptions {
  apiKey: string;
  model?: string;
}

export class LeadLLMService {
  private llm: ChatOpenAI;
  private qualifyingQuestions: string[];
  private criteria: { hot: string[]; cold: string[]; invalid: string[] };
  private greeting: string;

  constructor({
    apiKey,
    model = "gpt-4.1-2025-04-14",
    qualifyingQuestions,
    criteria,
    greeting,
  }: {
    apiKey: string;
    qualifyingQuestions: string[];
    criteria: { hot: string[]; cold: string[]; invalid: string[] };
    greeting: string;
    model?: string;
  }) {
    this.llm = new ChatOpenAI({
      modelName: model,
      temperature: 0.3,
      openAIApiKey: apiKey,
    });
    this.qualifyingQuestions = qualifyingQuestions;
    this.criteria = criteria;
    this.greeting = greeting;
  }

  /**
   * Analyze the peer's message and lead state to extract all qualifying answers
   * and suggest the next unanswered question only.
   */
  async handleUserMessage({
    messages,
    currentAnswers,
  }: {
    messages: Array<{ sender: "agent" | "user"; text: string }>;
    currentAnswers: Record<string, string>;
  }) {
    const chatHistory = messages
      .map((msg) => `${msg.sender === "agent" ? "Agent" : "Lead"}: ${msg.text}`)
      .join("\n");

    const prompt = `
You are a professional real estate AI assistant for GrowEasy.

Business rules:
- Greeting: ${this.greeting}
- Qualifying questions:\n${this.qualifyingQuestions
      .map((q) => `- ${q}`)
      .join("\n")}
- Lead criteria for status (hot/cold/invalid):\nHOT: ${this.criteria.hot.join("; ")}\nCOLD: ${this.criteria.cold.join(
      "; "
    )}\nINVALID: ${this.criteria.invalid.join("; ")}
Instructions:
- Always extract as many qualifying answers as possible from each lead message, even if multiple are answered at once.
- Do not repeat any already-answered questions.
- Only ask the next missing qualifying question if one remains. Otherwise move to classification and closing.
- For the extracted field: only include questions that have clear answers. Do not include null values or questions without answers.

Chat history:
${chatHistory}

Current extracted answers:
${JSON.stringify(currentAnswers)}

Now:
1. Extract new answers from the user message above (as a map with question text as key). Only include questions with actual answers.
2. Give a list of missing qualifying questions (by text).
3. Based on all info and chat, classify the lead as hot/cold/invalid, and explain your reasoning using the provided criteria.
4. If there are missing questions, suggest only the next unanswered one, else suggest what to say to close (e.g., site visit, offers).
Respond in JSON:

{
  "extracted": { [questionText]: "answer" },
  "missingQuestions": [remainingQuestions...],
  "classification": "hot"|"cold"|"invalid"|"pending",
  "reasoning": "string",
  "nextQuestion": "string"
}
`;

    const response = await this.llm.invoke([{
      role: "system",
      content: "You are a helpful real estate assistant. Output strictly valid JSON, do not include markdown. For the extracted field, only include questions that have clear answers - do not include null values."
    },
    {
      role: "user",
      content: prompt
    }]);
    
    // Try to robustly parse LLM output
    let json: any = {};
    try {
      let contentString: string;
      if (typeof response.content === "string") {
        contentString = response.content;
      } else {
        // fallback: coerce content to string
        contentString = JSON.stringify(response.content);
      }
      const match = contentString.match(/\{[\s\S]+\}/);
      const parsedJson = JSON.parse(match ? match[0] : contentString);
      
      // Clean up the extracted field to remove null values
      if (parsedJson.extracted) {
        const cleanedExtracted: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsedJson.extracted)) {
          if (value !== null && value !== undefined && value !== "") {
            cleanedExtracted[key] = value as string;
          }
        }
        parsedJson.extracted = cleanedExtracted;
      }
      
      json = parsedJson;
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
      // fallback: unstructured or invalid json, just fallback classification
      json = {
        extracted: {},
        missingQuestions: [],
        classification: "pending",
        reasoning: "Could not parse LLM output",
        nextQuestion: null,
      };
    }
    return QualifyingResultSchema.parse(json);
  }
}
