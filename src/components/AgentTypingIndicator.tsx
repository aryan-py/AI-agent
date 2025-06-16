
import { Bot } from "lucide-react";

/**
 * Animated indicator showing the agent (AI) is typing.
 */
const AgentTypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-white text-gray-800 shadow-sm px-4 py-2 rounded-lg max-w-xs">
      <div className="flex items-center space-x-2">
        <Bot className="w-4 h-4 text-emerald-600" />
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  </div>
);

export default AgentTypingIndicator;
