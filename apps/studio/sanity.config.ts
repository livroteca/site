import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "default",
  title: "Livroteca Brincante do Pina",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "hxzxnh1c",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
