import { useState } from "react";

export default function AccountTab() {
  const [language, setLanguage] = useState("pt-BR");

  return (
    <div className="w-full p-6 pb-8 text-white">
      {/* CONTA */}
      <h2 className="text-xl font-semibold mb-4">Conta</h2>
      <p className="text-sm text-gray-300 mb-4">
        Faça login para acessar recursos premium, sincronizar suas configurações e acompanhar seu uso.
      </p>

      <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-semibold">
            S
          </div>

          <div className="flex-1">
            <p className="text-base font-medium">User</p>
            <p className="text-sm text-gray-300">gabriellprimer@gmail.com</p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* IDIOMA */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Idioma</h3>
        <p className="text-sm text-gray-300 mb-2">
          Escolha o idioma da sua preferência para a interface do aplicativo.
        </p>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>

      {/* GERENCIAMENTO DE DADOS */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Gerenciamento de Dados</h3>
        <p className="text-sm text-gray-300 mb-4">
          Gerencie seus dados de conversa armazenados localmente. Todos os dados são armazenados localmente no seu dispositivo.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">2</p>
            <p className="text-xs text-gray-300">SESSÕES</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">4</p>
            <p className="text-xs text-gray-300">MENSAGENS</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-gray-300">ATIVO</p>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm">
          Limpar Todos os Dados
        </button>
      </div>
    </div>
  );
}

