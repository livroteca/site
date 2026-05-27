import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { buildLegacyTheme } from "sanity";
import { schemaTypes } from "./schemas";

// Pernambuco palette — matches the public site tokens in global.css.
const COR = {
  amarelo: "#EBC926",
  vermelho: "#C03E2D",
  verde: "#4A7C3A",
  tinta: "#1A1A1A",
  papel: "#FAF7F0",
};

const livrotecaTheme = buildLegacyTheme({
  "--black": COR.tinta,
  "--white": COR.papel,

  "--gray": "#666666",
  "--gray-base": COR.tinta,

  "--component-bg": COR.papel,
  "--component-text-color": COR.tinta,

  // Primary brand color (buttons, links, focus rings)
  "--brand-primary": COR.vermelho,

  // Defaults for nav / sidebar
  "--default-button-color": COR.tinta,
  "--default-button-primary-color": COR.vermelho,
  "--default-button-success-color": COR.verde,
  "--default-button-warning-color": COR.amarelo,
  "--default-button-danger-color": COR.vermelho,

  // States
  "--state-info-color": COR.verde,
  "--state-success-color": COR.verde,
  "--state-warning-color": COR.amarelo,
  "--state-danger-color": COR.vermelho,

  // Focus
  "--focus-color": COR.vermelho,
});

export default defineConfig({
  name: "default",
  title: "Livroteca Brincante do Pina",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "hxzxnh1c",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",

  theme: livrotecaTheme,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
