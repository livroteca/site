import type { SanityEvent } from "./events";

const ev = (
  id: string,
  slug: string,
  titlePt: string,
  titleEn: string,
  start: string,
  end: string,
  location: string,
  opts: { recurrence?: string; recurrenceEnd?: string; exceptions?: string[]; excerptPt?: string; excerptEn?: string } = {}
): SanityEvent => ({
  _id: `mock-${id}`,
  type: "evento",
  slug,
  title: { pt: titlePt, en: titleEn },
  date: start,
  excerpt: opts.excerptPt || opts.excerptEn ? { pt: opts.excerptPt, en: opts.excerptEn } : undefined,
  event: {
    start,
    end,
    location,
    recurrence: opts.recurrence,
    recurrenceEnd: opts.recurrenceEnd,
    exceptions: opts.exceptions,
  },
});

export const MOCK_EVENTS: SanityEvent[] = [
  ev("capoeira", "capoeira", "Roda de Capoeira", "Capoeira Circle",
    "2026-04-01T19:00:00.000Z", "2026-04-01T21:00:00.000Z", "Quadra da Livroteca",
    { recurrence: "FREQ=WEEKLY;BYDAY=WE", recurrenceEnd: "2026-12-31T00:00:00.000Z", exceptions: ["2026-05-20T19:00:00.000Z"] }),

  ev("musica", "aulas-de-musica", "Aulas de Música", "Music Lessons",
    "2026-04-07T20:00:00.000Z", "2026-04-07T22:00:00.000Z", "Sala de música",
    { recurrence: "FREQ=WEEKLY;BYDAY=TU", recurrenceEnd: "2026-12-31T00:00:00.000Z" }),

  ev("cinebode", "cine-bode", "Cine Bode", "Cine Bode",
    "2026-04-03T22:00:00.000Z", "2026-04-04T00:00:00.000Z", "Quadra da Livroteca",
    { recurrence: "FREQ=WEEKLY;BYDAY=FR", recurrenceEnd: "2026-12-31T00:00:00.000Z" }),

  ev("desenho", "oficina-de-desenho", "Oficina de Desenho", "Drawing Workshop",
    "2026-04-02T18:00:00.000Z", "2026-04-02T20:00:00.000Z", "Biblioteca",
    { recurrence: "FREQ=WEEKLY;BYDAY=TH", recurrenceEnd: "2026-12-31T00:00:00.000Z" }),

  ev("circo", "circo-infantil", "Circo Infantil", "Children's Circus",
    "2026-04-04T13:00:00.000Z", "2026-04-04T15:00:00.000Z", "Quadra da Livroteca",
    { recurrence: "FREQ=WEEKLY;BYDAY=SA", recurrenceEnd: "2026-12-31T00:00:00.000Z" }),

  ev("leitura", "leitura-coletiva", "Leitura Coletiva", "Collective Reading",
    "2026-04-06T19:00:00.000Z", "2026-04-06T20:30:00.000Z", "Biblioteca",
    { recurrence: "FREQ=WEEKLY;BYDAY=MO", recurrenceEnd: "2026-12-31T00:00:00.000Z" }),

  ev("grafiti", "oficina-de-grafiti", "Oficina de Grafiti", "Graffiti Workshop",
    "2026-05-09T17:00:00.000Z", "2026-05-09T20:00:00.000Z", "Muro do Bode",
    { excerptPt: "Oficina aberta com o coletivo Grafita Recife.", excerptEn: "Open workshop with the Grafita Recife collective." }),

  ev("maes", "festa-das-maes", "Festa das Mães", "Mothers' Day Celebration",
    "2026-05-10T18:00:00.000Z", "2026-05-10T21:00:00.000Z", "Quadra da Livroteca"),

  ev("workshop-foto", "workshop-fotografia", "Workshop de Fotografia", "Photography Workshop",
    "2026-05-13T17:00:00.000Z", "2026-05-13T19:00:00.000Z", "Biblioteca"),

  ev("bingo", "bingo-beneficente", "Bingo Beneficente", "Charity Bingo",
    "2026-05-16T21:00:00.000Z", "2026-05-16T23:30:00.000Z", "Quadra da Livroteca",
    { excerptPt: "Renda revertida para a manutenção da Livroteca.", excerptEn: "Proceeds support the Livroteca." }),

  ev("vacina", "campanha-de-vacinacao", "Campanha de Vacinação", "Vaccination Drive",
    "2026-05-17T12:00:00.000Z", "2026-05-17T17:00:00.000Z", "Quadra da Livroteca",
    { excerptPt: "Em parceria com a Secretaria de Saúde do Recife.", excerptEn: "Partnership with Recife's Health Department." }),

  ev("lancamento", "lancamento-de-livro", "Lançamento de Livro", "Book Launch",
    "2026-05-23T20:00:00.000Z", "2026-05-23T22:00:00.000Z", "Biblioteca"),

  ev("musical", "apresentacao-musical", "Apresentação Musical", "Music Performance",
    "2026-05-30T22:00:00.000Z", "2026-05-31T00:00:00.000Z", "Quadra da Livroteca"),

  ev("roda-especial", "roda-especial-de-capoeira", "Roda Especial de Capoeira", "Special Capoeira Circle",
    "2026-05-03T19:00:00.000Z", "2026-05-03T22:00:00.000Z", "Praia do Pina",
    { excerptPt: "Roda aberta com mestres convidados.", excerptEn: "Open circle with guest masters." }),

  ev("passeio", "passeio-de-barco", "Passeio de Barco", "Boat Trip",
    "2026-05-31T13:00:00.000Z", "2026-05-31T17:00:00.000Z", "Cais do Pina"),
];
