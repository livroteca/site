import { defineType, defineField } from "sanity";

export default defineType({
  name: "episodioPodcast",
  title: "Episódio — A Voz da Lama",
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
    }),
    defineField({
      name: "number",
      title: "Número do episódio",
      type: "number",
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "audioUrl",
      title: "URL do áudio (R2)",
      type: "url",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "durationSeconds",
      title: "Duração (segundos)",
      type: "number",
    }),
    defineField({
      name: "description",
      title: "Descrição",
      type: "localizedText",
    }),
    defineField({
      name: "transcript",
      title: "Transcrição",
      type: "localizedPortableText",
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "publishedAt" },
  },
});
