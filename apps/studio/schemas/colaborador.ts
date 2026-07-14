import { defineType, defineField } from "sanity";

export default defineType({
  name: "colaborador",
  title: "Parceiro / apoiador",
  type: "document",
  description:
    "Comércios, organismos e redes que apoiam a Livroteca. Aparecem na seção 'Parceiros e apoiadores' de /sobre-nos.",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tipo",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Apoio recorrente (comércio/doador)", value: "apoio_recorrente" },
          { title: "Parceiro (organismo/instituição)", value: "parceiro" },
          { title: "Rede (da qual fazemos parte)", value: "rede" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "url",
      title: "Site / link",
      type: "url",
    }),
    defineField({
      name: "order",
      title: "Ordem",
      type: "number",
      description: "Menor aparece primeiro dentro do seu grupo.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "tipo", media: "logo" },
  },
});
