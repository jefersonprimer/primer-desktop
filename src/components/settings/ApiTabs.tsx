import { useState } from "react";

const tabs = ["OpenAI", "Google", "OpenRouter", "Custom API"];

export default function ApiTabs() {
  const [active, setActive] = useState("Google");

  return (
    <div className="flex gap-2 border-b border-neutral-700 px-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-4 py-2 rounded-t-lg transition ${
            active === tab
              ? "bg-neutral-800 text-blue-400 border-b-2 border-blue-400"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

