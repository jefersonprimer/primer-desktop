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
    <div className="w-full h-full bg-white dark:bg-[#1D1D1F] p-6 text-gray-900 dark:text-white flex flex-col gap-6 pb-8 transition-colors">
      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-white">Sobre</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Versão: 0.1.0</p>
      </div>

      <div className="w-full gap-6">
        <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Comunidade</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-[#242425] text-gray-900 dark:text-white rounded-lg transition-colors">
            <div className="p-4 space-y-4">
              <p className="text-base font-medium flex items-center gap-2">
                <MessagesSquareIcon size={20} color="#141414" fill="#B9B9B9"/>
                Discord
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Junte-se à nossa comunidade no Discord para obter ajuda, compartilhar feedback e conectar-se.</p>
              <button className="text-base bg-gray-200 dark:bg-[#262626] hover:bg-gray-300 dark:hover:bg-[#141414]/40 border border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg w-full transition-colors">Entrar no Discord</button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#242425] text-gray-900 dark:text-white rounded-lg transition-colors">
            <div className="p-4 space-y-4">
              <p className="text-base font-medium flex items-center gap-2">
                <CircleQuestionMarkIcon size={20} stroke="#141414" fill="#B9B9B9" />
                Suporte
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Precisa de ajuda com algo específico? Confira nossa documentação.</p>
              <button className="text-base bg-gray-200 dark:bg-[#262626] border border-gray-300 dark:border-neutral-700 hover:bg-gray-300 dark:hover:bg-[#141414]/40 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg w-full transition-colors">Obter Ajuda</button>
            </div>
          </div>
        </div>

        {/* Primeiros Passos */}
        <div className="my-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Primeiros Passos</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Precisa de uma atualização? Reinicie o guia de integração para revisar permissões, configurações de áudio e configurações de API.</p>
          <button className="flex w-full px-4 items-center mt-4 gap-2 bg-gray-100 dark:bg-[#242425] hover:bg-gray-200 dark:hover:bg-[#141414]/40 text-gray-700 dark:text-white font-medium py-2 rounded-lg transition-colors border border-gray-200 dark:border-transparent">
            <RotateCcwIcon size={20} />
            Reiniciar Integração
          </button>
        </div>

        {/* Logs de Depuração */}
        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Logs de Depuração</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-mono bg-gray-100 dark:bg-[#242425] p-2 rounded overflow-x-auto transition-colors">
            {logPath}
          </p>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleOpenFolder}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#242425] hover:bg-gray-200 dark:hover:bg-[#141414]/40 text-gray-700 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors border border-gray-200 dark:border-transparent"
            >
              <FolderIcon size={20}/>
              Abrir Pasta de Logs
            </button>

            <button 
              onClick={handleCopyLogs}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#242425] hover:bg-gray-200 dark:hover:bg-[#141414]/40 text-gray-700 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors border border-gray-200 dark:border-transparent"
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
