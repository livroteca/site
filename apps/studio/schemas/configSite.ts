import { defineType, defineField } from "sanity";

export default defineType({
  name: "configSite",
  title: "Configuração do site",
  type: "document",
  description:
    "Singleton — edite o único documento existente. Não criar novos.",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Título do site",
      type: "localizedString",
    }),
    defineField({
      name: "siteDescription",
      title: "Descrição (meta + redes sociais)",
      type: "localizedText",
    }),
    defineField({
      name: "contactEmail",
      title: "Email de contato",
      type: "string",
      description: "Ex.: contato@livrotecabrincantedopina.org",
    }),

    defineField({
      name: "address",
      title: "Endereço / Onde encontrar",
      type: "object",
      fields: [
        { name: "local", type: "string", title: "Local (ex.: Comunidade do Bode)" },
        { name: "city", type: "string", title: "Cidade (ex.: Pina · Recife/PE)" },
        { name: "hours", type: "string", title: "Horários (ex.: Seg a sáb · 14h–18h)" },
        { name: "mapUrl", type: "url", title: "URL Google Maps" },
      ],
    }),

    defineField({
      name: "pixKey",
      title: "Chave PIX",
      type: "string",
    }),
    defineField({
      name: "pixQrImage",
      title: "QR code PIX (imagem)",
      type: "image",
      description: "Imagem do QR code da chave PIX. Gerar no app do banco.",
    }),
    defineField({
      name: "mercadoPagoUrl",
      title: "Link Mercado Pago",
      type: "url",
      description: "Link hosted gerado no Mercado Pago para doações.",
    }),
    defineField({
      name: "bankInfo",
      title: "Dados bancários",
      type: "object",
      fields: [
        { name: "banco", type: "string", title: "Banco" },
        { name: "agencia", type: "string", title: "Agência" },
        { name: "conta", type: "string", title: "Conta" },
        { name: "favorecido", type: "string", title: "Favorecido" },
        { name: "cnpj", type: "string", title: "CNPJ" },
      ],
    }),

    defineField({
      name: "social",
      title: "Redes sociais",
      type: "object",
      fields: [
        { name: "instagram", type: "url", title: "Instagram" },
        { name: "facebook", type: "url", title: "Facebook" },
        { name: "youtube", type: "url", title: "YouTube" },
        { name: "tunein", type: "url", title: "TuneIn (A Voz da Lama)" },
      ],
    }),
  ],
  preview: {
    select: { title: "siteTitle.pt" },
    prepare: ({ title }) => ({ title: title || "Configuração do site" }),
  },
});
