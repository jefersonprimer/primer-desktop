import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../../contexts/AuthContext";

interface NotionStatus {
    is_connected: boolean;
    workspace_name?: string;
}

export default function NotionCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useAuth();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            const logMsg = (msg: string) => invoke("log_frontend_message", { message: `[NotionCallback] ${msg}` }).catch(console.error);
            
            logMsg("Callback initiated");

            if (!userId) {
                logMsg("Error: User not logged in");
                setErrorMsg("User not logged in");
                setStatus("error");
                return;
            }

            const params = new URLSearchParams(location.search);
            const code = params.get("code");
            const error = params.get("error");

            if (error) {
                logMsg(`Error from Notion: ${error}`);
                setErrorMsg(`Notion Error: ${error}`);
                setStatus("error");
                return;
            }

            if (!code) {
                logMsg("Error: No authorization code found");
                setErrorMsg("No authorization code found");
                setStatus("error");
                return;
            }

            logMsg(`Exchanging code for user ${userId}`);

            try {
                await invoke<NotionStatus>("exchange_notion_code", {
                    code,
                    userId
                });
                logMsg("Exchange successful");
                setStatus("success");
                setTimeout(() => {
                    logMsg("Redirecting to /home");
                    navigate("/home"); // Or open settings?
                }, 2000);
            } catch (err) {
                const eMsg = typeof err === 'string' ? err : JSON.stringify(err);
                logMsg(`Exchange failed: ${eMsg}`);
                console.error(err);
                setErrorMsg(typeof err === 'string' ? err : "Failed to exchange token");
                setStatus("error");
            }
        };

        handleCallback();
    }, [location, navigate, userId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
            <div className="text-center p-8 rounded-xl bg-neutral-800">
                {status === "processing" && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Connecting to Notion...</h2>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    </div>
                )}

                {status === "success" && (
                    <div>
                        <h2 className="text-xl font-bold mb-2 text-green-400">Connected!</h2>
                        <p>Your Notion workspace has been successfully linked.</p>
                        <p className="text-sm text-neutral-400 mt-2">Redirecting...</p>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <h2 className="text-xl font-bold mb-2 text-red-400">Connection Failed</h2>
                        <p className="text-red-200">{errorMsg}</p>
                        <button
                            onClick={() => navigate("/home")}
                            className="mt-4 px-4 py-2 bg-neutral-700 rounded hover:bg-neutral-600"
                        >
                            Return Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
