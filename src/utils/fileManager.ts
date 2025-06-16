
// Utility functions for managing leads and conversations data
// In a real implementation, these would interact with actual JSON files

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  message?: string;
  status: "pending" | "hot" | "cold" | "invalid";
  timestamp: string;
}

export interface Message {
  id: string;
  sender: "agent" | "user";
  text: string;
  timestamp: string;
}

export interface Conversation {
  leadId: string;
  messages: Message[];
  classification: {
    status: "hot" | "cold" | "invalid";
    metadata: {
      location?: string;
      propertyType?: string;
      budget?: string;
      timeline?: string;
      purpose?: string;
      reason?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessConfig {
  id: string;
  name: string;
  industry: string;
  location: string;
  greeting: string;
  qualifyingQuestions: string[];
  hotCriteria: string[];
  coldCriteria: string[];
  invalidCriteria: string[];
}

// Sample data for demonstration
export const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "Rohit Sharma",
    phone: "+91-9876543210",
    source: "Website inquiry",
    message: "Hi, I'm interested in buying a property.",
    status: "hot",
    timestamp: new Date().toISOString()
  },
  {
    id: "2",
    name: "Priya Patel",
    phone: "+91-9876543211",
    source: "Facebook Ad",
    status: "cold",
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "3",
    name: "Test User",
    phone: "+91-1234567890",
    source: "Website form",
    status: "invalid",
    timestamp: new Date(Date.now() - 172800000).toISOString()
  }
];

export const sampleConversations: Conversation[] = [
  {
    leadId: "1",
    messages: [
      {
        id: "1",
        sender: "user",
        text: "Hi, I'm interested in buying a property.",
        timestamp: new Date().toISOString()
      },
      {
        id: "2",
        sender: "agent",
        text: "Hi Rohit! Thanks for reaching out. I'm your GrowEasy real estate assistant. Could you share which city/location you're looking for?",
        timestamp: new Date().toISOString()
      }
    ],
    classification: {
      status: "hot",
      metadata: {
        location: "Pune (Kalyani Nagar)",
        propertyType: "2BHK Flat",
        budget: "₹75L",
        timeline: "3 months",
        purpose: "Personal use"
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultBusinessConfig: BusinessConfig = {
  id: "1",
  name: "GrowEasy Realtors",
  industry: "real-estate",
  location: "Mumbai, India",
  greeting: "Hi {name}! Thanks for reaching out. I'm your GrowEasy real estate assistant.",
  qualifyingQuestions: [
    "Which city/location are you looking for?",
    "Are you looking for a flat, villa, or plot?",
    "Is this for investment or personal use?",
    "What's your budget range?",
    "What's your timeline for purchase/move?"
  ],
  hotCriteria: [
    "Specific location mentioned",
    "Clear budget range provided",
    "Urgent timeline (within 3-6 months)",
    "Ready for site visit",
    "Responsive to follow-up questions"
  ],
  coldCriteria: [
    "Vague requirements",
    "No clear timeline",
    "Budget not disclosed",
    "Just browsing",
    "Unresponsive to closing questions"
  ],
  invalidCriteria: [
    "Gibberish or non-meaningful responses",
    "Test entries",
    "Spam or bot activity",
    "Abusive language",
    "Completely irrelevant queries"
  ]
};

// Functions to simulate file operations
export const loadLeads = (): Lead[] => {
  // In real implementation: read from leads.json file
  return sampleLeads;
};

export const saveLead = (lead: Lead): void => {
  // In real implementation: append to leads.json file
  console.log("Saving lead to file:", lead);
};

export const loadConversations = (): Conversation[] => {
  // In real implementation: read from conversations.json file
  return sampleConversations;
};

export const saveConversation = (conversation: Conversation): void => {
  // In real implementation: append to conversations.json file
  console.log("Saving conversation to file:", conversation);
};

export const loadBusinessConfig = (): BusinessConfig => {
  // In real implementation: read from config.json file
  return defaultBusinessConfig;
};

export const saveBusinessConfig = (config: BusinessConfig): void => {
  // In real implementation: write to config.json file
  console.log("Saving business config to file:", config);
};

// Helper function to classify leads based on conversation
export const classifyLead = (messages: Message[], config: BusinessConfig): {
  status: "hot" | "cold" | "invalid";
  metadata: any;
} => {
  // Simple rule-based classification for demo
  const userMessages = messages.filter(m => m.sender === "user").map(m => m.text.toLowerCase());
  const conversationText = userMessages.join(" ");

  // Check for invalid patterns
  if (conversationText.match(/^[a-z\s]*$/i) && conversationText.length < 10) {
    return {
      status: "invalid",
      metadata: { reason: "Gibberish or test entry" }
    };
  }

  // Check for hot lead indicators
  const hotIndicators = [
    conversationText.includes("budget"),
    conversationText.includes("urgent"),
    conversationText.includes("ready"),
    conversationText.includes("schedule"),
    conversationText.includes("visit")
  ];

  if (hotIndicators.filter(Boolean).length >= 2) {
    return {
      status: "hot",
      metadata: {
        location: extractLocation(conversationText),
        budget: extractBudget(conversationText),
        timeline: extractTimeline(conversationText)
      }
    };
  }

  // Default to cold
  return {
    status: "cold",
    metadata: { reason: "Insufficient qualifying information" }
  };
};

const extractLocation = (text: string): string | undefined => {
  const cities = ["mumbai", "pune", "bangalore", "delhi", "gurgaon", "noida"];
  const found = cities.find(city => text.includes(city));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : undefined;
};

const extractBudget = (text: string): string | undefined => {
  const budgetMatch = text.match(/(\d+)l/i);
  return budgetMatch ? `₹${budgetMatch[1]}L` : undefined;
};

const extractTimeline = (text: string): string | undefined => {
  if (text.includes("urgent") || text.includes("asap")) return "Urgent";
  if (text.includes("month")) return "1-3 months";
  if (text.includes("year")) return "6-12 months";
  return undefined;
};
