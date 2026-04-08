import { Globe } from "lucide-react";
import { useAppLanguage } from "@/contexts/LanguageContext";

export const LanguageDropdown = () => {
  const { language, setLanguage, options, t } = useAppLanguage();

  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 shadow-sm">
      <Globe className="h-4 w-4 text-slate-600 dark:text-gray-300" />
      <label htmlFor="app-language-select" className="sr-only">
        {t("header.language", "Language")}
      </label>
      <select
        id="app-language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as typeof language)}
        className="text-sm rounded bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 outline-none border border-slate-300 dark:border-gray-600 px-2 py-1"
        style={{ colorScheme: "dark" }}
        aria-label={t("header.language", "Language")}
      >
        {options.map((option) => (
          <option key={option.code} value={option.code} className="bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100">
            {option.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
};
