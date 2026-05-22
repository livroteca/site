import { defineType, defineField } from "sanity";

export default defineType({
  name: "localizedText",
  title: "Texto longo localizado",
  type: "object",
  fields: [
    defineField({ name: "pt", title: "Português", type: "text", rows: 4 }),
    defineField({ name: "en", title: "English", type: "text", rows: 4 }),
  ],
});
