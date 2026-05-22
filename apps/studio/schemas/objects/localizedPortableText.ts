import { defineType, defineField } from "sanity";

const portableTextField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      {
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "Título 2", value: "h2" },
          { title: "Título 3", value: "h3" },
          { title: "Citação", value: "blockquote" },
        ],
        marks: {
          decorators: [
            { title: "Negrito", value: "strong" },
            { title: "Itálico", value: "em" },
          ],
        },
      },
      { type: "image", options: { hotspot: true } },
    ],
  });

export default defineType({
  name: "localizedPortableText",
  title: "Conteúdo rico localizado",
  type: "object",
  fields: [
    portableTextField("pt", "Português"),
    portableTextField("en", "English"),
  ],
});
