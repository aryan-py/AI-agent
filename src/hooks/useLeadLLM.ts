import { useRef } from "react";
import { LeadLLMService } from "@/services/leadLLMService";

let serviceInstance: null | LeadLLMService = null;

interface UseLeadLLMParams {
  apiKey: string; // Provide your OpenAI key here (secure way in production!)
  qualifyingQuestions: string[];
  criteria: { hot: string[]; cold: string[]; invalid: string[] };
  greeting: string;
}

export function useLeadLLM({
  apiKey,
  qualifyingQuestions,
  criteria,
  greeting,
}: UseLeadLLMParams) {
  // Singleton pattern to keep LLM instance
  const ref = useRef<LeadLLMService>();
  if (!ref.current) {
    ref.current = new LeadLLMService({
      apiKey,
      qualifyingQuestions,
      criteria,
      greeting,
    });
  }
  async function processUserMessage({
    messages,
    currentAnswers,
  }: {
    messages: Array<{ sender: "agent" | "user"; text: string }>;
    currentAnswers: Record<string, string>;
  }) {
    return ref.current!.handleUserMessage({ messages, currentAnswers });
  }
  return { processUserMessage };
}
