import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface ClearLocalAccountDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export default function ClearLocalAccountDataModal({ isOpen, onClose, onConfirm, isLoading }: ClearLocalAccountDataModalProps) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#1D1D1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl transition-colors">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
           {t("account.dataManagement.clearAll")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {t("account.dataManagement.confirmClear")}
        </p>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition"
            disabled={isLoading}
          >
            {t("account.deleteAccount.cancelButton")}
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t("account.dataManagement.clearAll")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

