import { useStealthMode } from '../../contexts/StealthModeContext'; // Adjust path as needed

export default function PrivacyTab() {
  const { isStealth, toggleStealth } = useStealthMode();
  const isLinux = navigator.platform.toLowerCase().includes('linux');

  return (
    <div className="w-full bg-black p-6 text-white flex flex-col gap-6 pb-8">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
       <svg 
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          <path d="M12 22V2"/>
       </svg>
        Privacidade
      </h2>

      <div className="border border-neutral-800 rounded-2xl shadow-xl">
        <div className="p-6 flex flex-col gap-6">
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

          <div className="bg-neutral-800 border border-yellow-600/40 text-yellow-400 p-4 rounded-xl text-sm">
            Stealth Mode é premium. Faça upgrade para ocultar o app da dock e taskbar.
          </div>

          <p className="text-neutral-400 text-sm leading-relaxed">
            O modo furtivo é ativado sempre na inicialização para máxima privacidade. Essa configuração controla se o conteúdo está visível para outros aplicativos.
          </p>

          {isLinux && (
            <div className="bg-neutral-800 border border-red-600/40 text-red-400 p-4 rounded-xl text-sm mt-4">
              <h4 className="font-semibold text-base mb-2">Atenção: Modo Furtivo no Linux (X11 Apenas)</h4>
              <p className="mb-3">
                O Modo Furtivo e recursos de Click-Through **são compatíveis apenas com X11 no Linux**. Se você estiver usando Wayland, essas funcionalidades não estarão disponíveis. Por favor, mude para X11 para usar o Modo Furtivo.
              </p>
              <h5 className="font-medium text-sm mb-1">Como mudar para X11 no Ubuntu (GNOME):</h5>
              <ol className="list-decimal list-inside text-neutral-300 text-xs flex flex-col gap-1 pl-4">
                <li>Saia da sessão atual.</li>
                <li>Clique no seu usuário, mas <strong>NÃO faça login ainda</strong>.</li>
                <li>No canto inferior direito do botão de login, clique no ícone de engrenagem ⚙️.</li>
                <li>Selecione <strong>“GNOME on Xorg”</strong> ou <strong>“Ubuntu on Xorg”</strong>.</li>
                <li>Agora faça login normalmente.</li>
              </ol>
              <p className="mt-3 text-xs text-neutral-300">
                <strong>🔍 Como confirmar depois:</strong> Abra o terminal e rode <code>echo $XDG_SESSION_TYPE</code>. Você deve ver <code>x11</code>.
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

          <div className="flex justify-end">
            <button className="px-6 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg">
              Salvar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
