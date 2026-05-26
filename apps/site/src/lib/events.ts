import rrule from "rrule";
const { RRuleSet, rrulestr } = rrule;
import { sanity } from "./sanity";
import type { Locale } from "./i18n";
import { dateLocale, shortLocale } from "./i18n";

export interface SanityImageRef {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
}

export interface LocalizedString {
  pt?: string;
  en?: string;
}

export interface SanityEvent {
  _id: string;
  type: "evento";
  slug: string;
  title: LocalizedString;
  date: string;
  cover?: SanityImageRef;
  excerpt?: { pt?: string; en?: string };
  event: {
    start?: string;
    end?: string;
    location?: string;
    recurrence?: string;
    recurrenceEnd?: string;
    exceptions?: string[];
  };
}

export interface Occurrence {
  id: string;
  slug: string;
  title: string;
  start: Date;
  end?: Date;
  location?: string;
  recurring: boolean;
}

const EVENTS_QUERY = `*[_type == "artigo" && type == "evento" && defined(event.start)]{
  _id,
  type,
  "slug": slug.current,
  title,
  date,
  cover,
  excerpt,
  event
}`;

export async function getEvents(): Promise<SanityEvent[]> {
  const events = await sanity.fetch<SanityEvent[]>(EVENTS_QUERY);
  if (import.meta.env.DEV) {
    const { MOCK_EVENTS } = await import("./events.mock");
    return [...events, ...MOCK_EVENTS];
  }
  return events;
}

export function expandOccurrences(
  events: SanityEvent[],
  windowStart: Date,
  windowEnd: Date,
  locale: Locale = "pt-BR"
): Occurrence[] {
  const short = shortLocale(locale);
  const out: Occurrence[] = [];

  for (const ev of events) {
    if (!ev.event?.start) continue;
    const title = ev.title?.[short] ?? ev.title?.pt ?? "(sem título)";
    const startDate = new Date(ev.event.start);
    const endDate = ev.event.end ? new Date(ev.event.end) : undefined;
    const durationMs = endDate ? endDate.getTime() - startDate.getTime() : 0;

    if (!ev.event.recurrence) {
      if (startDate >= windowStart && startDate <= windowEnd) {
        out.push({
          id: ev._id,
          slug: ev.slug,
          title,
          start: startDate,
          end: endDate,
          location: ev.event.location,
          recurring: false,
        });
      }
      continue;
    }

    const set = new RRuleSet();
    const dtstart = startDate.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const lines = [`DTSTART:${dtstart}`, `RRULE:${ev.event.recurrence}`];
    if (ev.event.recurrenceEnd) {
      const until = new Date(ev.event.recurrenceEnd)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+/, "");
      lines[1] = `RRULE:${ev.event.recurrence};UNTIL=${until}`;
    }
    try {
      set.rrule(rrulestr(lines.join("\n")) as any);
    } catch (err) {
      console.warn(`[events] RRULE invalide pour ${ev._id}: ${err}`);
      continue;
    }
    for (const exDate of ev.event.exceptions ?? []) {
      set.exdate(new Date(exDate));
    }

    const occurrences = set.between(windowStart, windowEnd, true);
    for (const occ of occurrences) {
      out.push({
        id: `${ev._id}@${occ.toISOString()}`,
        slug: ev.slug,
        title,
        start: occ,
        end: durationMs ? new Date(occ.getTime() + durationMs) : undefined,
        location: ev.event.location,
        recurring: true,
      });
    }
  }

  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

export function monthLabel(d: Date, locale: Locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    month: "long",
    year: "numeric",
  })
    .format(d)
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function monthShort(d: Date, locale: Locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { month: "short" })
    .format(d)
    .replace(/\./g, "")
    .toUpperCase();
}

export function weekdayLong(d: Date, locale: Locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { weekday: "long" })
    .format(d)
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function weekdayShort(d: Date, locale: Locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { weekday: "short" })
    .format(d)
    .replace(/\./g, "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function fmtHora(d: Date, locale: Locale = "pt-BR"): string {
  const h = d.getHours();
  const m = d.getMinutes();
  if (locale === "en") {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  occurrences: Occurrence[];
}

export function buildMonthGrid(
  monthDate: Date,
  occurrences: Occurrence[]
): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const lastOfMonth = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push(makeCell(d, false, today, occurrences));
  }

  for (let day = 1; day <= lastOfMonth.getDate(); day++) {
    const d = new Date(year, month, day);
    cells.push(makeCell(d, true, today, occurrences));
  }

  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - firstWeekday - lastOfMonth.getDate() + 1);
    cells.push(makeCell(d, false, today, occurrences));
  }
  if (cells.length < 35) {
    while (cells.length < 35) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push(makeCell(d, false, today, occurrences));
    }
  }

  return cells;
}

function makeCell(d: Date, inMonth: boolean, today: Date, all: Occurrence[]): CalendarCell {
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  const occurrences = all.filter((o) => o.start >= dayStart && o.start < dayEnd);
  return {
    date: d,
    inMonth,
    isToday: d.getTime() === today.getTime(),
    occurrences,
  };
}
