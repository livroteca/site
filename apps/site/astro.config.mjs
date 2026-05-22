// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
