import { fallbackText, localeOptions, messages, type Locale, type MessageKey } from "./messages";

export type I18n = {
  locale: Locale;
  t(key: MessageKey | string): string;
};

export function isLocale(value: string | null | undefined): value is Locale {
  return localeOptions.some((option) => option.id === value);
}

export function createI18n(locale: Locale = "ko"): I18n {
  return {
    locale,
    t(key) {
      const table = messages[locale] as Record<string, string>;
      const fallbackTable = messages.ko as Record<string, string>;
      return table[key as string] ?? fallbackTable[key as string] ?? fallbackText;
    },
  };
}

export { localeOptions };
export type { Locale, MessageKey };
