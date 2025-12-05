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
    <div className="w-full h-full overflow-y-auto space-y-4 pr-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[75%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-neutral-800 text-neutral-200"
            }`}
          >
            {m.content}
            <div className="text-xs opacity-60 mt-1">
              {new Date(m.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

