import { defineType, defineField } from "sanity";

export default defineType({
  name: "configSite",
  title: "Configuração do site",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Título do site",
      type: "localizedString",
    }),
    defineField({
      name: "siteDescription",
      title: "Descrição",
      type: "localizedText",
    }),
    defineField({
      name: "contactEmail",
      title: "Email de contato",
      type: "string",
    }),
    defineField({
      name: "pixKey",
      title: "Chave PIX",
      type: "string",
    }),
    defineField({
      name: "social",
      title: "Redes sociais",
      type: "object",
      fields: [
        { name: "instagram", type: "url", title: "Instagram" },
        { name: "youtube", type: "url", title: "YouTube" },
        { name: "facebook", type: "url", title: "Facebook" },
      ],
    }),
  ],
});
