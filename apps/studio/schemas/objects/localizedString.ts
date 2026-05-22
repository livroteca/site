import { defineType, defineField } from "sanity";

export default defineType({
  name: "localizedString",
  title: "Texto localizado",
  type: "object",
  fields: [
    defineField({ name: "pt", title: "Português", type: "string" }),
    defineField({ name: "en", title: "English", type: "string" }),
  ],
});
