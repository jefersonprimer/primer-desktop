import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import CheckIcon from "../ui/icons/CheckIcon";

interface WhisperManagerProps {
  activeModel: string;
  onModelChange: (modelId: string) => void;
}

interface WhisperModelStatus {
  name: string;
  exists: boolean;
  path: string;
  size_desc: string;
  ram_desc: string;
}

interface DownloadProgress {
  name: string;
  percentage: number;
}

export default function WhisperManager({ activeModel, onModelChange }: WhisperManagerProps) {
  const [whisperModels, setWhisperModels] = useState<WhisperModelStatus[]>([]);
  const [loadingWhisper, setLoadingWhisper] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  useEffect(() => {
    console.log("[WhisperManager] Mounted. Active model:", activeModel);
    fetchWhisperModels();

    const unlisten = listen<DownloadProgress>("whisper-download-progress", (event) => {
      if (event.payload.name === downloadingModel) {
        setDownloadProgress(event.payload.percentage);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [downloadingModel]);

  const fetchWhisperModels = async () => {
    setLoadingWhisper(true);
    try {
      const models = await invoke<WhisperModelStatus[]>("check_whisper_models");
      setWhisperModels(models);
    } catch (err) {
      console.error("Failed to check Whisper models:", err);
    } finally {
      setLoadingWhisper(false);
    }
  };

  const handleDownload = async (name: string) => {
    setDownloadingModel(name);
    setDownloadProgress(0);
    try {
      await invoke("download_whisper_model", { name });
      await fetchWhisperModels();
    } catch (err) {
      console.error("Failed to download model:", err);
      alert(`Failed to download model: ${err}`);
    } finally {
      setDownloadingModel(null);
      setDownloadProgress(0);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-base font-semibold text-white">Local Model Management</h4>
      <p className="text-sm text-neutral-400 mb-3">
        Download and select the model that fits your hardware. larger models are more accurate but slower.
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm text-left text-neutral-400">
          <thead className="text-xs text-neutral-200 uppercase bg-neutral-900">
            <tr>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">RAM</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingWhisper ? (
              <tr className="border-b border-neutral-800 bg-black">
                <td colSpan={5} className="px-4 py-3 text-center text-neutral-500">
                  Checking models...
                </td>
              </tr>
            ) : (
              whisperModels.map((m) => (
                <tr key={m.name} className={`border-b border-neutral-800 bg-black hover:bg-neutral-900 ${activeModel === m.name ? 'bg-blue-900/10' : ''}`}>
                  <td className="px-4 py-3 font-medium text-white capitalize flex items-center gap-2">
                    {m.name}
                    {activeModel === m.name && <CheckIcon size={14} color="#3b82f6" />}
                  </td>
                  <td className="px-4 py-3">{m.size_desc}</td>
                  <td className="px-4 py-3">{m.ram_desc}</td>
                  <td className="px-4 py-3">
                    {downloadingModel === m.name ? (
                      <div className="w-24 bg-neutral-800 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                        <span className="text-[10px] text-blue-400 block mt-1">{Math.round(downloadProgress)}%</span>
                      </div>
                    ) : m.exists ? (
                      <span className="text-green-500 flex items-center gap-1 text-xs">
                        Installed
                      </span>
                    ) : (
                      <span className="text-neutral-600 text-xs">Not Installed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.exists ? (
                      <button 
                        onClick={() => onModelChange(m.name)}
                        className={`px-3 py-1 rounded text-xs transition border ${
                          activeModel === m.name 
                          ? "bg-blue-600 text-white border-blue-500" 
                          : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
                        }`}
                      >
                        {activeModel === m.name ? "Selected" : "Select"}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDownload(m.name)}
                        disabled={downloadingModel !== null}
                        className="px-3 py-1 bg-neutral-800 text-blue-400 border border-blue-900/30 rounded text-xs hover:bg-blue-900/20 transition disabled:opacity-50"
                      >
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
