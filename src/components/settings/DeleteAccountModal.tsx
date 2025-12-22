import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading: boolean;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, isLoading }: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      await onConfirm(password);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1D1D1F] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-2">
          {t("account.deleteAccount.modalTitle")}
        </h2>
        <p className="text-sm text-gray-300 mb-6">
          {t("account.deleteAccount.modalWarning")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("account.deleteAccount.passwordLabel")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition font-medium cursor-pointer"
              disabled={isLoading}
            >
              {t("account.deleteAccount.cancelButton")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition font-medium flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {t("account.deleteAccount.confirmButton")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
