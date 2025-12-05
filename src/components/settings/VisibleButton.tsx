export default function VisibleButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        className="px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 backdrop-blur-md hover:bg-black/80 transition"
      >
        👁 Aplicativo visível
      </button>
    </div>
  );
}

