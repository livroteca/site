import { defineType, defineField } from "sanity";

export default defineType({
  name: "artigo",
  title: "Artigo / Evento",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "localizedString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: (doc: any) => doc?.title?.pt ?? "" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "type",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Artigo", value: "artigo" },
          { title: "Evento", value: "evento" },
        ],
        layout: "radio",
      },
      initialValue: "artigo",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      title: "Data de publicação",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "cover",
      title: "Imagem de capa",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "localizedText",
    }),
    defineField({
      name: "body",
      title: "Corpo",
      type: "localizedPortableText",
    }),
    defineField({
      name: "authors",
      title: "Autores",
      type: "array",
      of: [{ type: "reference", to: [{ type: "pessoa" }] }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "event",
      title: "Detalhes do evento",
      type: "object",
      hidden: ({ parent }) => parent?.type !== "evento",
      fields: [
        defineField({
          name: "start",
          title: "Início",
          type: "datetime",
        }),
        defineField({
          name: "end",
          title: "Fim",
          type: "datetime",
        }),
        defineField({
          name: "location",
          title: "Local",
          type: "string",
        }),
        defineField({
          name: "recurrence",
          title: "Recorrência (RRULE)",
          type: "string",
          description:
            "iCal RRULE — ex: FREQ=WEEKLY;BYDAY=MO,WE,FR. Deixe em branco para evento único.",
        }),
        defineField({
          name: "recurrenceEnd",
          title: "Fim da recorrência",
          type: "datetime",
        }),
        defineField({
          name: "exceptions",
          title: "Datas canceladas",
          type: "array",
          of: [{ type: "datetime" }],
          description: "EXDATE — datas em que esta ocorrência não acontece.",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title.pt",
      subtitle: "type",
      media: "cover",
    },
  },
});
