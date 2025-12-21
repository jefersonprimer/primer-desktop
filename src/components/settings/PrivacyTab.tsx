import { useStealthMode } from '../../contexts/StealthModeContext'; // Adjust path as needed
import CircleStarIcon from "../ui/icons/CircleStarIcon";

export default function PrivacyTab() {
  const { isStealth, toggleStealth, isClickThrough, toggleClickThrough, isAlwaysOnTop, toggleAlwaysOnTop } = useStealthMode();
  const isLinux = navigator.platform.toLowerCase().includes('linux');

  return (
    <div className="w-full bg-[#1D1D1F] p-6 text-white flex flex-col gap-6 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">Modo furtivo</h2>
        <p className="text-sm uppercase bg-[#141414] border border-neutral-700 py-1 px-4 rounded-2xl">privacidade</p>
      </div>

      <div >
        <div className="flex flex-col gap-6">
         <div className="p-4 border border-neutral-800 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Modo Furtivo</h3>
            <button
              onClick={toggleStealth}
              className={`w-12 h-6 rounded-full transition-all relative ${
                isStealth ? "bg-blue-600" : "bg-neutral-700"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${
                  isStealth ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center bg-[#1A1501] border border-yellow-600/40 text-yellow-400 p-2 gap-2 my-2 rounded-xl text-sm">
            <CircleStarIcon size={18} color="#F8E23A"/>
            Stealth Mode é premium. Faça upgrade para ocultar o app da dock e taskbar.
          </div>
          </div>

          <div className="p-4 border border-neutral-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Click-Through (Interagir Através)</h3>
              <button
                onClick={toggleClickThrough}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  isClickThrough ? "bg-blue-600" : "bg-neutral-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${
                    isClickThrough ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
              Permite clicar através da janela do aplicativo. 
              <span className="block mt-1 text-yellow-400">
                Atenção: Quando ativado, você não conseguirá interagir com o app com o mouse. Use o atalho global (Command/Ctrl + Shift + S) para desativar.
              </span>
            </p>
          </div>

          <div className="p-4 border border-neutral-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sempre no Topo (Always On Top)</h3>
              <button
                onClick={toggleAlwaysOnTop}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  isAlwaysOnTop ? "bg-blue-600" : "bg-neutral-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${
                    isAlwaysOnTop ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
              Mantém a janela do aplicativo sempre visível sobre as outras janelas.
            </p>
          </div>

          <p className="text-neutral-400 text-sm leading-relaxed">
            O modo furtivo é ativado sempre na inicialização para máxima privacidade. Essa configuração controla se o conteúdo está visível para outros aplicativos.
          </p>

          {isLinux && (
            <div className="bg-neutral-800 border border-red-600/40 text-red-400 p-4 rounded-xl text-sm mt-4">
              <h4 className="font-semibold text-base mb-2">Atenção: Modo Furtivo no Linux (X11 Apenas)</h4>
              <p className="mb-3 text-white">
                O Modo Furtivo e recursos de Click-Through **são compatíveis apenas com X11 no Linux**. Se você estiver usando Wayland, essas funcionalidades não estarão disponíveis. Por favor, mude para X11 para usar o Modo Furtivo.
              </p>
              <h5 className="font-medium text-sm mb-1">Como mudar para X11 no Ubuntu (GNOME):</h5>
              <ol className="list-decimal list-inside text-neutral-300 text-sm flex flex-col gap-1 pl-4">
                <li>Saia da sessão atual.</li>
                <li>Clique no seu usuário, mas <strong>NÃO faça login ainda</strong>.</li>
                <li>No canto inferior direito do botão de login, clique no ícone de engrenagem ⚙️.</li>
                <li>Selecione <strong>“GNOME on Xorg”</strong> ou <strong>“Ubuntu on Xorg”</strong>.</li>
                <li>Agora faça login normalmente.</li>
              </ol>
              <p className="mt-3 text-xs text-neutral-300">
                <strong>Como confirmar depois:</strong> Abra o terminal e rode <code>echo $XDG_SESSION_TYPE</code>. Você deve ver <code>x11</code>.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-base">Como usar no Zoom</h4>
            <ol className="list-decimal list-inside text-neutral-300 text-sm flex flex-col gap-1">
              <li>Abra Zoom → Configurações → Compartilhamento → Avançado</li>
              <li>Defina "Modo de captura" para "Captura avançada com filtragem de janela"</li>
            </ol>
            <p className="text-yellow-400 text-xs">
              Sempre teste com um amigo antes da reunião para garantir invisibilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
