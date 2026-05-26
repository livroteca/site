import { toHTML, type PortableTextHtmlComponents } from "@portabletext/to-html";
import { sanity, urlFor } from "./sanity";
import type { LocalizedString, SanityImageRef } from "./events";
import { dateLocale, shortLocale, type Locale } from "./i18n";

export interface Author {
  _id: string;
  name: string;
  role?: LocalizedString;
}

export interface Artigo {
  _id: string;
  type: "artigo" | "evento";
  slug: string;
  title: LocalizedString;
  date: string;
  cover?: SanityImageRef;
  excerpt?: { pt?: string; en?: string };
  body?: { pt?: any[]; en?: any[] };
  authors?: Author[];
  tags?: string[];
  event?: {
    start?: string;
    end?: string;
    location?: string;
    recurrence?: string;
    recurrenceEnd?: string;
    exceptions?: string[];
  };
}

const ARTIGO_PROJECTION = `{
  _id,
  type,
  "slug": slug.current,
  title,
  date,
  cover,
  excerpt,
  body,
  tags,
  event,
  "authors": authors[]->{_id, name, role}
}`;

export async function getAllArtigos(): Promise<Artigo[]> {
  return sanity.fetch(
    `*[_type == "artigo"] | order(date desc)${ARTIGO_PROJECTION}`
  );
}

export async function getRecentArticles(limit = 3): Promise<Artigo[]> {
  return sanity.fetch(
    `*[_type == "artigo" && type == "artigo"] | order(date desc)[0...$limit]${ARTIGO_PROJECTION}`,
    { limit }
  );
}

export async function getArtigoBySlug(slug: string): Promise<Artigo | null> {
  return sanity.fetch(
    `*[_type == "artigo" && slug.current == $slug][0]${ARTIGO_PROJECTION}`,
    { slug }
  );
}

export async function getAllSlugs(): Promise<string[]> {
  return sanity.fetch(`*[_type == "artigo" && defined(slug.current)].slug.current`);
}

// ──────────────────────────────────────────────────────────────
// configSite (singleton)
// ──────────────────────────────────────────────────────────────

export interface SiteConfig {
  siteTitle?: LocalizedString;
  siteDescription?: { pt?: string; en?: string };
  contactEmail?: string;
  address?: {
    local?: string;
    city?: string;
    hours?: string;
    mapUrl?: string;
  };
  pixKey?: string;
  pixQrImage?: SanityImageRef;
  mercadoPagoUrl?: string;
  bankInfo?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    favorecido?: string;
    cnpj?: string;
  };
  social?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tunein?: string;
  };
}

export async function getSiteConfig(): Promise<SiteConfig | null> {
  return sanity.fetch(`*[_type == "configSite"][0]{
    siteTitle, siteDescription, contactEmail,
    address, pixKey, pixQrImage, mercadoPagoUrl, bankInfo, social
  }`);
}

export function pixQrUrl(qr: SanityImageRef | undefined, width = 480): string | null {
  if (!qr?.asset?._ref) return null;
  return urlFor(qr).width(width).fit("max").auto("format").url();
}

// ──────────────────────────────────────────────────────────────
// Pessoa
// ──────────────────────────────────────────────────────────────

export interface Pessoa {
  _id: string;
  name: string;
  slug?: string;
  role?: LocalizedString;
  bio?: { pt?: string; en?: string };
  photo?: SanityImageRef;
}

export async function getPessoaBySlug(slug: string): Promise<Pessoa | null> {
  return sanity.fetch(
    `*[_type == "pessoa" && slug.current == $slug][0]{
      _id, name, "slug": slug.current, role, bio, photo
    }`,
    { slug }
  );
}

export function pessoaPhotoUrl(p: Pessoa | null | undefined, width = 480): string | null {
  if (!p?.photo?.asset?._ref) return null;
  return urlFor(p.photo).width(width).fit("crop").auto("format").url();
}

export function pessoaRoleFor(p: Pessoa, locale: Locale = "pt-BR"): string {
  const s = shortLocale(locale);
  return p.role?.[s] ?? p.role?.pt ?? "";
}

export function pessoaBioFor(p: Pessoa, locale: Locale = "pt-BR"): string {
  const s = shortLocale(locale);
  return p.bio?.[s] ?? p.bio?.pt ?? "";
}

// ──────────────────────────────────────────────────────────────
// Episódio podcast
// ──────────────────────────────────────────────────────────────

export interface PodcastEpisode {
  _id: string;
  title: LocalizedString;
  number?: number;
  publishedAt: string;
  audioUrl?: string;
  externalUrl?: string;
  durationSeconds?: number;
  description?: { pt?: string; en?: string };
}

export async function getPodcastEpisodes(): Promise<PodcastEpisode[]> {
  return sanity.fetch(`*[_type == "episodioPodcast"] | order(number desc, publishedAt desc){
    _id, title, number, publishedAt, audioUrl, externalUrl, durationSeconds, description
  }`);
}

// ──────────────────────────────────────────────────────────────
// Documentos transparência
// ──────────────────────────────────────────────────────────────

export interface DocumentoTransparencia {
  _id: string;
  title: LocalizedString;
  category?: string;
  date: string;
  fileUrl: string;
}

export async function getDocumentosTransparencia(): Promise<DocumentoTransparencia[]> {
  return sanity.fetch(
    `*[_type == "documentoTransparencia"] | order(date desc){_id, title, category, date, fileUrl}`
  );
}

const CATEGORIA_LABELS: Record<string, string> = {
  balanco: "Balanço",
  ata: "Ata",
  prestacao: "Prestação de contas",
  estatuto: "Estatuto",
  outro: "Outro",
};

export function categoriaLabel(c?: string): string {
  return c ? CATEGORIA_LABELS[c] ?? c : "Documento";
}

const portableTextComponents: Partial<PortableTextHtmlComponents> = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) return "";
      const url = urlFor(value).width(1200).fit("max").auto("format").url();
      const alt = value.alt ?? "";
      return `<figure><img src="${url}" alt="${escapeHtml(alt)}" loading="lazy" /></figure>`;
    },
  },
};

export function portableTextToHtml(blocks: any[] | undefined): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
  return toHTML(blocks, { components: portableTextComponents });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function coverUrl(cover: SanityImageRef | undefined, width = 800): string | null {
  if (!cover?.asset?._ref) return null;
  return urlFor(cover).width(width).fit("crop").auto("format").url();
}

export function titleFor(a: { title?: LocalizedString }, locale: Locale = "pt-BR"): string {
  const s = shortLocale(locale);
  return a.title?.[s] ?? a.title?.pt ?? "(sem título)";
}

export function excerptFor(a: Artigo, locale: Locale = "pt-BR"): string {
  const s = shortLocale(locale);
  return a.excerpt?.[s] ?? a.excerpt?.pt ?? "";
}

export function portableTextFor(a: Artigo, locale: Locale = "pt-BR"): any[] | undefined {
  const s = shortLocale(locale);
  return a.body?.[s] ?? a.body?.pt;
}

export function hasTranslation(a: Artigo, locale: Locale): boolean {
  if (locale === "pt-BR") return true;
  const s = shortLocale(locale);
  return Boolean(a.title?.[s] && (a.body?.[s] || a.excerpt?.[s]));
}

export function fmtDate(iso: string, locale: Locale = "pt-BR"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(dateLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
