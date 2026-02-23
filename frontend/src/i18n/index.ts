import ar from "./ar.json";
import en from "./en.json";

export type Language = "ar" | "en";
type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  ar,
  en,
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "ar" || value === "en";
}

export function getDictionary(language: Language): Dictionary {
  return dictionaries[language];
}

export function translate(
  language: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dictionary = getDictionary(language);
  const template = dictionary[key] ?? key;

  if (!params) return template;

  return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
    return result.replaceAll(`{{${paramKey}}}`, String(paramValue));
  }, template);
}
