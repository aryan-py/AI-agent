import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, ArrowLeft, Bot, User } from "lucide-react";
import { useLeadLLM } from "@/hooks/useLeadLLM";
import { toast } from "@/components/ui/use-toast";
import QualifyingProgress from "./QualifyingProgress";
import AgentTypingIndicator from "./AgentTypingIndicator";

// Helper to get config from localStorage (from Config page)
function getBusinessConfig() {
  try {
    const configStr = localStorage.getItem("business_config");
    if (configStr) return JSON.parse(configStr);
  } catch {}
  // fallback (default config matches Config.tsx)
  return {
    name: "GrowEasy Realtors",
    industry: "real-estate",
    location: "Mumbai, India",
    greeting:
      "Hi {name}! Thanks for reaching out. I'm your GrowEasy real estate assistant.",
    qualifyingQuestions: [
      "Which city/location are you looking for?",
      "Are you looking for a flat, villa, or plot?",
      "Is this for investment or personal use?",
      "What's your budget range?",
      "What's your timeline for purchase/move?",
    ],
    hotCriteria: [
      "Specific location mentioned",
      "Clear budget range provided",
      "Urgent timeline (within 3-6 months)",
      "Ready for site visit",
      "Responsive to follow-up questions",
    ],
    coldCriteria: [
      "Vague requirements",
      "No clear timeline",
      "Budget not disclosed",
      "Just browsing",
      "Unresponsive to closing questions",
    ],
    invalidCriteria: [
      "Gibberish or non-meaningful responses",
      "Test entries",
      "Spam or bot activity",
      "Abusive language",
      "Completely irrelevant queries",
    ],
    greetingLead: null,
  };
}

const API_KEY_LOCALSTORAGE_KEY = "openai_api_key";

interface Message {
  id: string;
  sender: "agent" | "user";
  text: string;
  timestamp: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  message?: string;
  status: "pending" | "hot" | "cold" | "invalid";
}

interface ChatInterfaceProps {
  leadId: string;
  onBack: () => void;
}

const ChatInterface = ({ leadId, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);
  const [classification, setClassification] = useState<
    "hot" | "cold" | "invalid" | "pending"
  >("pending");
  const [finalMessage, setFinalMessage] = useState<string | null>(null);
  const [llmError, setLLMError] = useState<string | null>(null);

  // Track conversation completion
  const [conversationComplete, setConversationComplete] = useState(false);

  // Get config & API key from localStorage
  const businessConfig = getBusinessConfig();
  const apiKey = localStorage.getItem(API_KEY_LOCALSTORAGE_KEY) || "";

  // Add: validate key format for more helpful error
  const validApiKey = apiKey && apiKey.startsWith("sk-");

  // Setup LLM hook
  // DEBUG: Log attempt to use key
  useEffect(() => {
    // Only log to console, not UI
    if (apiKey) {
      console.log("[ChatInterface] Using OpenAI API key:", apiKey.slice(0, 7) + "..." + apiKey.slice(-3));
    } else {
      console.log("[ChatInterface] No OpenAI API key found in localStorage");
    }
  }, [apiKey]);

  const { processUserMessage } = useLeadLLM({
    apiKey,
    qualifyingQuestions: businessConfig.qualifyingQuestions,
    criteria: {
      hot: businessConfig.hotCriteria,
      cold: businessConfig.coldCriteria,
      invalid: businessConfig.invalidCriteria,
    },
    greeting: businessConfig.greeting.replace(
      "{name}",
      lead?.name || "there"
    ),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load lead data and initialize conversation
    const sampleLeads = [
      {
        id: "1",
        name: "Rohit Sharma",
        phone: "+91-9876543210",
        source: "Website inquiry",
        message: "Hi, I'm interested in buying a property.",
        status: "hot" as const,
      },
      {
        id: "2",
        name: "Priya Patel",
        phone: "+91-9876543211",
        source: "Facebook Ad",
        status: "cold" as const,
      },
      {
        id: "3",
        name: "Test User",
        phone: "+91-1234567890",
        source: "Website form",
        message: "Test user message",
        status: "invalid" as const,
      },
    ];

    const currentLead = sampleLeads.find((l) => l.id === leadId);
    if (currentLead) {
      setLead(currentLead);

      // Agent greeting message (always first)
      const firstMessage: Message = {
        id: "1",
        sender: "agent",
        text: businessConfig.greeting.replace(
          "{name}",
          currentLead.name || "there"
        ) +
          " " +
          businessConfig.qualifyingQuestions[0],
        timestamp: new Date().toISOString(),
      };

      // Only the agent's first message (remove user's initial message entirely)
      const initialMessages: Message[] = [firstMessage];

      setMessages(initialMessages);
      // Reset LLM state
      setAnswers({});
      setMissingQuestions(businessConfig.qualifyingQuestions);
      setClassification("pending");
      setConversationComplete(false);
      setFinalMessage(null);
      setLLMError(null);
    }
    // eslint-disable-next-line
  }, [leadId]);

  // Listen for the user message, send it to LLM, and update state
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !apiKey || conversationComplete) return;
    setLLMError(null);

    // 1. Add user message to chat UI
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsAgentTyping(true);

    let currentAnswers = { ...answers };
    // 2. LLM logic - send all previous messages + answers so far
    try {
      const llmResult = await processUserMessage({
        messages: [
          ...messages,
          {
            sender: "user",
            text: inputMessage,
          },
        ],
        currentAnswers,
      });

      // Update answers and status
      if (llmResult.extracted) {
        // Merge in any newly extracted answers
        for (const q of Object.keys(llmResult.extracted)) {
          if (
            llmResult.extracted[q] &&
            !currentAnswers[q]
          ) {
            currentAnswers[q] = llmResult.extracted[q];
          }
        }
        setAnswers(currentAnswers);
      }
      setMissingQuestions(llmResult.missingQuestions);
      setClassification(llmResult.classification);

      // 3. Decide what agent should say next
      let agentText = "";
      if (
        (!llmResult.missingQuestions ||
          llmResult.missingQuestions.length === 0) &&
        llmResult.classification !== "pending"
      ) {
        // All questions answered! End the conversation.
        agentText =
          "Thank you for providing all the details! Our team at GrowEasy Realtors will review your requirements and contact you soon (usually within 24 hours). Have a great day!";

        setConversationComplete(true);
        setFinalMessage(agentText);
      } else if (llmResult.nextQuestion) {
        agentText = llmResult.nextQuestion;
      } else {
        // fallback
        agentText =
          "Thank you. We'll review your details and get back to you very soon!";
        setConversationComplete(true);
        setFinalMessage(agentText);
      }

      // Show agent (AI) response in chat
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: agentText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (e: any) {
      // Improved error logging and messages
      console.error("[ChatInterface] Error connecting to AI service:", e);
      let errorMsg = "There was a problem connecting to the AI service. Please check your API key and try again!";
      if (e?.message) {
        errorMsg += ` (Error message: ${e.message})`;
      }
      if (e?.response && e.response.status) {
        errorMsg += ` (Status: ${e.response.status})`;
      }
      setLLMError(
        errorMsg +
        "\n\nTip: Double check that your OpenAI API key was saved and is correct. " +
        "Make sure your browser network isn't blocking the OpenAI domain (https://api.openai.com), and that your key has usage quota left. " +
        "Try disabling browser extensions that block requests (adblockers/firewalls), and refresh this page."
      );
      toast({
        title: "AI service connection failed",
        description: "Check your API key, internet connection, and browser firewall/extensions. Console logs may show more detail.",
        variant: "destructive",
      });
    } finally {
      setIsAgentTyping(false);
    }
  };

  // Clean: Move getStatusColor outside of render and add typing.
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "hot":
        return "bg-red-500";
      case "cold":
        return "bg-blue-500";
      case "invalid":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!lead) {
    return <div>Loading...</div>;
  }
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6">
        <p className="text-lg font-semibold mb-4">
          OpenAI API key missing
        </p>
        <p>
          Please configure your OpenAI API key on the <a href="/config" className="underline text-emerald-700">Config</a> page to enable conversation.
        </p>
      </div>
    );
  }
  if (!validApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6">
        <p className="text-lg font-semibold mb-4">
          OpenAI API key format invalid
        </p>
        <p>
          The supplied API key doesn't start with <code>sk-</code>. Please re-enter your key on the <a href="/config" className="underline text-emerald-700">Config</a> page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Chat Header */}
      <div className="bg-emerald-600 text-white p-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white hover:bg-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="font-semibold">{lead.name.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{lead.name}</h3>
          <p className="text-sm text-emerald-100">{lead.phone}</p>
        </div>
        <Badge className={`${getStatusColor(classification)} text-white`}>
          {classification.toUpperCase()}
        </Badge>
        <Button variant="ghost" size="sm" className="text-white hover:bg-emerald-700">
          <Phone className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-4 py-1 border-b bg-white flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-700">
            {lead.source}
          </span>
        </div>
        <div>
          <QualifyingProgress
            answered={Object.values(answers).filter((a) => a && a.trim() !== "").length}
            total={businessConfig.qualifyingQuestions.length}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-800 shadow-sm"
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === "agent" && (
                  <Bot className="w-4 h-4 mt-1 text-emerald-600" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === "user" ? "text-emerald-100" : "text-gray-500"
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <User className="w-4 h-4 mt-1 text-emerald-100" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Show agent typing indicator */}
        {isAgentTyping && <AgentTypingIndicator />}

        {/* Error message */}
        {llmError && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded text-sm">
              {llmError}
            </div>
          </div>
        )}
        {/* Conversation complete success message */}
        {conversationComplete && finalMessage && (
          <div className="flex justify-center mt-4">
            <div className="bg-emerald-100 border border-emerald-300 px-4 py-3 rounded text-emerald-900 font-medium">
              {finalMessage}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            disabled={isAgentTyping || conversationComplete}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              conversationComplete
                ? "Conversation completed."
                : "Type a message..."
            }
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isAgentTyping || conversationComplete}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {conversationComplete && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            Your requirements have been successfully recorded. You will be contacted soon.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

// File is still large. Further refactoring into smaller components (ChatHeader, MessageBubble, etc.) is recommended.
