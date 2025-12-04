const items = [
  "API e Modelos",
  "Áudio e Tela",
  "Permissões",
  "Recursos",
  "Atalhos",
  "Privacidade",
  "Conta",
  "Premium",
  "Ajuda",
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-700 h-full py-4">
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item}
            className={`text-left px-4 py-2 w-full text-neutral-300 hover:bg-neutral-800 hover:text-white transition ${
              item === "API e Modelos" ? "bg-neutral-800 text-white" : ""
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}

