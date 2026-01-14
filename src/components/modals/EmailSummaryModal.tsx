import { useState, useEffect } from "react";
import CloseIcon from "@/components/ui/icons/CloseIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { invoke } from "@tauri-apps/api/core";

interface EmailSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBody: string;
}

export function EmailSummaryModal({ isOpen, onClose, initialBody }: EmailSummaryModalProps) {
  const { userEmail } = useAuth();
  const { addNotification } = useNotification();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  // No longer blocking UI for sending
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBody(initialBody);
      if (!to && userEmail) setTo(userEmail);
      if (!subject) setSubject("Summary: Meeting Session");
    }
  }, [isOpen, initialBody, userEmail]);

  const handleSend = () => {
    if (!to || !subject || !body) return;

    // Fire and forget (non-blocking)
    // Note: CC and BCC are not currently supported by the backend
    invoke("send_email", {
      dto: {
        to,
        subject,
        html_body: body.replace(/\n/g, "<br>"),
        text_body: body
      }
    })
      .then(() => {
        addNotification({
          type: 'success',
          message: 'Email sent successfully'
        });
      })
      .catch((error) => {
        console.error("Failed to send email:", error);
        addNotification({
          type: 'error',
          message: `Failed to send email: ${error}`
        });
      });

    // Close immediately
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-[#212121] text-zinc-100 shadow-2xl border border-white/10 scale-100 animate-in zoom-in-95 duration-200">
        {/* Header - TO */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 text-sm flex-1">
            <span className="text-zinc-400 w-8">To</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="bg-transparent text-sm outline-none placeholder:text-zinc-600 flex-1 text-white"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            {!showCc && (
              <button 
                onClick={() => setShowCc(true)}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                CC
              </button>
            )}
            {!showBcc && (
              <button 
                onClick={() => setShowBcc(true)}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                BCC
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors ml-2">
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* CC Field */}
        {showCc && (
          <div className="flex items-center border-b border-white/10 px-4 py-2 animate-in slide-in-from-top-1 duration-200">
            <span className="text-zinc-400 text-sm w-8">Cc</span>
            <input
              type="email"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 text-white"
            />
            <button onClick={() => { setShowCc(false); setCc(""); }} className="text-zinc-500 hover:text-zinc-300">
              <CloseIcon size={12} />
            </button>
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div className="flex items-center border-b border-white/10 px-4 py-2 animate-in slide-in-from-top-1 duration-200">
            <span className="text-zinc-400 text-sm w-8">Bcc</span>
            <input
              type="email"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 text-white"
            />
            <button onClick={() => { setShowBcc(false); setBcc(""); }} className="text-zinc-500 hover:text-zinc-300">
              <CloseIcon size={12} />
            </button>
          </div>
        )}

        {/* Subject */}
        <div className="border-b border-white/10 px-4 py-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600 font-medium text-white"
          />
        </div>

        {/* Body */}
        <div className="max-h-[420px] min-h-[300px] overflow-y-auto p-4 text-sm leading-relaxed custom-scrollbar">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full min-h-[280px] bg-transparent outline-none resize-none text-zinc-300 placeholder:text-zinc-600"
            placeholder="Type your message..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <button 
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors text-white shadow-lg shadow-blue-900/20"
            onClick={handleSend}
          >
            Send
          </button>

          <button 
            onClick={() => {
                setTo(userEmail || "");
                setCc("");
                setBcc("");
                setShowCc(false);
                setShowBcc(false);
                setSubject("Summary: Meeting Session");
                setBody(initialBody);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

