export default function VisibleButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        className="flex justify-center items-center gap-2 px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 backdrop-blur-md hover:bg-black/80 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-eye"
        >
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        <span>Aplicativo visível</span>
      </button>
    </div>
  );
}

