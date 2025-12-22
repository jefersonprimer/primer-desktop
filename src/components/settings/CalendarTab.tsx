import React from "react";
import CalendarIcon from "../ui/icons/CalendarIcon";

export default function CalendarTab() {
  const handleConnectGoogle = () => {
    // TODO: integrar OAuth / Tauri command
    console.log("Connect Google clicked");
  };

  return (
    <div className="px-6 py-4 pb-8 bg-[#1D1D1F] text-neutral-300 h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold">Visible Calendars</h2>
        <p className="text-sm text-zinc-400">
          Upcoming meetings are synchronized from these calendars
        </p>
      </div>

      {/* Empty state card */}
      <div className="rounded-lg border border-zinc-800 bg-[#272628] p-6 max-w-xl">
        <div className="flex flex-col gap-4">
          <div>
            <CalendarIcon size={18}/>
            <p className="text-sm text-white font-medium mt-2">No calendars</p>
            <p className="text-sm text-zinc-400">
              Get started by connecting a Google account.
            </p>
          </div>

          <button
            onClick={handleConnectGoogle}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-zinc-700 bg-[#423F44] hover:bg-[#423F44]/80 px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition"
          > 
            {/* Google icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 48 48"
              className="shrink-0"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19-8.5 19-19 0-1.3-.1-2.6-.4-3.9z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.1H42V20H24v8h11.3c-1.1 2.9-3.1 5.3-5.7 6.9l6.3 5.2C38.9 36.4 43 30.8 43 24c0-1.3-.1-2.6-.4-3.9z"
              />
            </svg>

            Connect Google
          </button>
        </div>
      </div>
    </div>
  );
}

