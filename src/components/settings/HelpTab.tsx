import { useState, useEffect } from "react";
import CircleQuestionMarkIcon from "../ui/icons/CircleQuestionMarkIcon";
import MessagesSquareIcon from "../ui/icons/MessagesSquareIcon";
import RotateCcwIcon from "../ui/icons/RotateCcwIcon";
import FolderIcon from "../ui/icons/FolderIcon";
import CopyIcon from "../ui/icons/CopyIcon";
import { openLogFolder, readLogContent, getLogPath } from "../../lib/tauri";

export default function HelpTab() {
  const [logPath, setLogPath] = useState<string>("/home/primer/.config/primer/logs/");
  const [copyStatus, setCopyStatus] = useState<string>("Copiar Logs para Área de Transferência");

  useEffect(() => {
    getLogPath().then(setLogPath).catch(console.error);
  }, []);

  const handleOpenFolder = async () => {
    try {
      await openLogFolder();
    } catch (error) {
      console.error("Failed to open logs folder:", error);
    }
  };

  const handleCopyLogs = async () => {
    try {
      const content = await readLogContent();
      await navigator.clipboard.writeText(content);
      setCopyStatus("Copiado!");
      setTimeout(() => setCopyStatus("Copiar Logs para Área de Transferência"), 2000);
    } catch (error) {
      console.error("Failed to copy logs:", error);
      setCopyStatus("Erro ao copiar (Arquivo não encontrado?)");
      setTimeout(() => setCopyStatus("Copiar Logs para Área de Transferência"), 2000);
    }
  };

  return (
    <div className="w-full bg-black p-6 text-white flex flex-col gap-6 pb-8">
      <div>
        <p className="text-xl font-semibold text-[#616161]">Sobre</p>
        <p className="text-sm font-medium">Versão: 0.1.0</p>
      </div>

      <div className="w-full gap-6">
        <h3 className="text-xl font-semibold mb-4">Comunidade</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#141414] border border-neutral-700 text-white rounded-xl">
            <div className="p-4 space-y-4">
              <p className="text-lg font-medium flex items-center gap-2">
                <MessagesSquareIcon size={24} color="#141414" fill="#B9B9B9"/>
                Discord
              </p>
              <p className="text-sm text-gray-300">Junte-se à nossa comunidade no Discord para obter ajuda, compartilhar feedback e conectar-se.</p>
              <button className="bg-[#262626] hover:bg-[#262626]/40 border border-neutral-700 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors">Entrar no Discord</button>
            </div>
          </div>

          <div className="bg-[#141414] border border-neutral-700 text-white rounded-xl">
            <div className="p-4 space-y-4">
              <p className="text-lg font-medium flex items-center gap-2">
                <CircleQuestionMarkIcon size={24} color="#141414" fill="#B9B9B9" />
                Suporte
              </p>
              <p className="text-sm text-gray-300">Precisa de ajuda com algo específico? Confira nossa documentação.</p>
              <button className="bg-[#262626] border border-neutral-700 hover:bg-[#262626]/40 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors">Obter Ajuda</button>
            </div>
          </div>
        </div>

        {/* Primeiros Passos */}
        <div className="my-4">
          <h3 className="text-xl font-semibold mb-3">Primeiros Passos</h3>
          <p>Precisa de uma atualização? Reinicie o guia de integração para revisar permissões, configurações de áudio e configurações de API.</p>
          <button className="flex w-full px-4 items-center mt-4 gap-2 bg-[#141414] hover:bg-[#141414]/40 border border-neutral-700 text-white font-medium py-2 rounded-lg transition-colors">
            <RotateCcwIcon size={20} />
            Reiniciar Integração
          </button>
        </div>

        {/* Logs de Depuração */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Logs de Depuração</h3>
          <p className="text-sm text-gray-300 mb-2 font-mono bg-black/50 p-2 rounded border border-white/5 overflow-x-auto">
            {logPath}
          </p>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleOpenFolder}
              className="flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#141414]/40 border border-neutral-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <FolderIcon size={20}/>
              Abrir Pasta de Logs
            </button>

            <button 
              onClick={handleCopyLogs}
              className="flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#141414]/40 border border-neutral-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <CopyIcon size={20}/>
              {copyStatus}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
