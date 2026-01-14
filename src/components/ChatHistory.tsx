import MarkdownRenderer from "./ui/MarkdownRenderer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  followUpOptions?: string[];
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  onFollowUpClick?: (text: string) => void;
}

export default function ChatHistory({ messages, onFollowUpClick }: ChatHistoryProps) {
  const userMessagesCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="w-full h-auto space-y-4">
      {messages.map((m) => {
        // Hide user message if it's the only user message in the session
        // (as it's already shown in the modal title)
        if (m.role === "user" && userMessagesCount <= 1) {
          return null;
        }

        return (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"
              }`}
          >
            <div
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                } w-full`}
            >
              <div
                className={`${m.role === "user"
                    ? "max-w-[85%] bg-black/5 dark:bg-white/5 px-4 py-2 rounded-2xl text-gray-800 dark:text-white/90 whitespace-pre-wrap shadow-sm"
                    : "w-full text-gray-900 dark:text-white"
                  } text-base`}
              >
                {m.role === "assistant" ? (
                  <MarkdownRenderer content={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>

            {/* Follow-up Options (Only for assistant) */}
            {m.role === "assistant" && m.followUpOptions && m.followUpOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 ml-1">
                {m.followUpOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => onFollowUpClick?.(option)}
                    className="px-4 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 rounded-full text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white transition-all text-left shadow-sm"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
