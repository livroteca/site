import { defineType, defineField } from "sanity";

export default defineType({
  name: "paginaInstitucional",
  title: "Página institucional",
  type: "document",
  fields: [
    defineField({
      name: "key",
      title: "Identificador",
      type: "string",
      description:
        "Identificador fixo da página: a-livroteca, doar, voluntariar, loja, transparencia, etc.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "Título",
      type: "localizedString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Conteúdo",
      type: "localizedPortableText",
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "key" },
  },
});
