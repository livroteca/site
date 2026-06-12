// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Horários de eventos são instantes UTC no Sanity mas devem ser exibidos em
// hora de Recife. O build SSG usa getHours()/limites de dia locais — sem isso,
// o CI da Cloudflare (UTC) renderiza tudo com +3h.
process.env.TZ = "America/Recife";

export default defineConfig({
  site: "https://livrotecabrincantedopina.org",
  integrations: [sitemap()],
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR", "en"],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    server: {
      fs: {
        allow: ["../.."],
      },
    },
  },
});
