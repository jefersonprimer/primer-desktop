interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <div className="w-full h-auto space-y-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className="w-full text-white text-base whitespace-pre-wrap"
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}

