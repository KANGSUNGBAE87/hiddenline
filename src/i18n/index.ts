import { fallbackText, messages, type Locale, type MessageKey } from "./messages";

export type I18n = {
  locale: Locale;
  t(key: MessageKey | string): string;
};

export function createI18n(locale: Locale = "ko"): I18n {
  return {
    locale,
    t(key) {
      const messageKey = key as MessageKey;
      return messages[locale][messageKey] ?? messages.ko[messageKey] ?? fallbackText;
    },
  };
}

export type { Locale, MessageKey };
