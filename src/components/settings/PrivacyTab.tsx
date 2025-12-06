import { useState } from "react";
import { Eye, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyTab() {
  const [visibleApp, setVisibleApp] = useState(false);

  return (
    <div className="w-full h-full p-6 text-white flex flex-col gap-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Shield className="w-6 h-6" /> Privacidade
      </h2>

      <Card className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
        <CardContent className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Aplicativo Visível</h3>
            <button
              onClick={() => setVisibleApp(!visibleApp)}
              className={`w-12 h-6 rounded-full transition-all relative ${
                visibleApp ? "bg-blue-600" : "bg-neutral-700"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${
                  visibleApp ? "translate-x-6" : "translate-x-0"
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
            <Button className="px-6 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg">
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

