import { useTranslation } from "react-i18next";
import CalendarIcon from "@/components/ui/icons/CalendarIcon";

export default function CalendarTab() {
  const { t } = useTranslation();

  const handleConnectGoogle = () => {
    // TODO: integrar OAuth / Tauri command
    console.log("Connect Google clicked");
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('calendar.title')}</h1>
        <p className="text-sm">
          {t('calendar.description')}
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-[#242425] p-6 rounded-xl border border-gray-200 dark:border-transparent">
        <div className="flex flex-col gap-4">
          <div>
            <CalendarIcon size={20} />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{t('calendar.noCalendars')}</h2>
            <p className="text-sm">
              {t('calendar.getStarted')}
            </p>
          </div>

          <button
            onClick={handleConnectGoogle}
            className="inline-flex w-fit items-center text-sm font-semibold text-gray-900 dark:text-white hover:text-white gap-2 rounded-lg border border-zinc-700 dark:border-neutral-600 bg-white dark:bg-[#423F44] hover:bg-zinc-700 px-4 py-2 transition"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              className="shrink-0"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19-8.5 19-19 0-1.3-.1-2.6-.4-3.9z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.4 35.7 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.1H42V20H24v8h11.3c-1.1 2.9-3.1 5.3-5.7 6.9l6.3 5.2C38.9 36.4 43 30.8 43 24c0-1.3-.1-2.6-.4-3.9z"
              />
            </svg>

            {t('calendar.connectGoogle')}
          </button>
        </div>
      </div>
    </div>
  );
}

