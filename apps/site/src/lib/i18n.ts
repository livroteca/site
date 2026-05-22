import ptBR from "../i18n/pt-BR.json";
import en from "../i18n/en.json";

export type Locale = "pt-BR" | "en";

const strings: Record<Locale, typeof ptBR> = {
  "pt-BR": ptBR,
  en: en as typeof ptBR,
};

export const LOCALES: Locale[] = ["pt-BR", "en"];

export function getLocaleFromUrl(url: URL): Locale {
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return "en";
  return "pt-BR";
}

export function useTranslations(locale: Locale) {
  return strings[locale] ?? strings["pt-BR"];
}

export function shortLocale(locale: Locale): "pt" | "en" {
  return locale === "en" ? "en" : "pt";
}

export function localizePath(targetLocale: Locale, currentPath: string): string {
  const stripped =
    currentPath === "/en" || currentPath === "/en/"
      ? "/"
      : currentPath.replace(/^\/en\//, "/");

  if (targetLocale === "en") {
    return stripped === "/" ? "/en/" : `/en${stripped}`;
  }
  return stripped;
}

export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "pt-BR";
}

export function dateLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "pt-BR";
}
