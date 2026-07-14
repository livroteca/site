import { defineType, defineField } from "sanity";

export default defineType({
  name: "pessoa",
  title: "Pessoa",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
    }),
    defineField({
      name: "role",
      title: "Função",
      type: "localizedString",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "localizedText",
    }),
    defineField({
      name: "photo",
      title: "Foto",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      title: "Ordem",
      type: "number",
      description:
        "Ordem de exibição na página 'Sobre Nós' (menor aparece primeiro).",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "role.pt", media: "photo" },
  },
});
