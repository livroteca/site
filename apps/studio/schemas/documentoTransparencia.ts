import { defineType, defineField } from "sanity";

export default defineType({
  name: "documentoTransparencia",
  title: "Documento de transparência",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "localizedString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "string",
      options: {
        list: [
          { title: "Balanço", value: "balanco" },
          { title: "Ata", value: "ata" },
          { title: "Prestação de contas", value: "prestacao" },
          { title: "Estatuto", value: "estatuto" },
          { title: "Outro", value: "outro" },
        ],
      },
    }),
    defineField({
      name: "date",
      title: "Data",
      type: "date",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "fileUrl",
      title: "URL do PDF (R2)",
      type: "url",
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "category" },
  },
});
