import { defineType, defineField } from "sanity";

export default defineType({
  name: "paginaInstitucional",
  title: "Página institucional",
  type: "document",
  description:
    "Sobrescreve o hero (etiqueta + título + lede) das páginas estáticas. Identificadores aceitos: home, a-livroteca, sobre-nos, doar, voluntariar, loja.",
  fields: [
    defineField({
      name: "key",
      title: "Identificador",
      type: "string",
      description:
        "Fixo. Valores aceitos: home, a-livroteca, sobre-nos, doar, voluntariar, loja.",
      options: {
        list: [
          { title: "Home (/)", value: "home" },
          { title: "A Livroteca (/a-livroteca)", value: "a-livroteca" },
          { title: "Sobre Nós (/sobre-nos)", value: "sobre-nos" },
          { title: "Doar (/doar)", value: "doar" },
          { title: "Voluntariar (/voluntariar)", value: "voluntariar" },
          { title: "Loja (/loja)", value: "loja" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "eyebrow",
      title: "Etiqueta (pequeno texto acima do título)",
      type: "localizedString",
      description:
        'Ex.: "Bode · Pina · Recife". Vazio = mantém o texto hardcoded.',
    }),
    defineField({
      name: "title",
      title: "Título principal",
      type: "localizedString",
      description: "Vazio = mantém o título hardcoded.",
    }),
    defineField({
      name: "lede",
      title: "Lede / parágrafo de introdução",
      type: "localizedText",
      description:
        "Parágrafo curto sob o título. Vazio = mantém o parágrafo hardcoded.",
    }),
    defineField({
      name: "body",
      title: "Conteúdo rico (opcional)",
      type: "localizedPortableText",
      description:
        "Usado pela página /loja e pela seção 'Quem somos' de /sobre-nos (missão, visão, valores). Para outras páginas, deixar vazio.",
    }),
  ],
  preview: {
    select: { title: "title.pt", subtitle: "key" },
    prepare: ({ title, subtitle }) => ({
      title: title || `[sem título]`,
      subtitle: `page: ${subtitle}`,
    }),
  },
});
