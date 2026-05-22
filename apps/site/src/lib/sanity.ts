import { createClient, type ClientConfig } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const config: ClientConfig = {
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET ?? "production",
  apiVersion: import.meta.env.SANITY_API_VERSION ?? "2026-05-22",
  useCdn: true,
};

export const sanity = createClient(config);

const builder = imageUrlBuilder(sanity);
export const urlFor = (src: SanityImageSource) => builder.image(src);
