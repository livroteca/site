// Generate the favicon set from the Livroteca logo + brand colors.
// Run: pnpm --filter site gen:favicons
// Outputs in apps/site/public/:
//   - favicon-32.png  (browser tab)
//   - favicon-16.png  (small fallback)
//   - apple-touch-icon.png  (180x180, iOS home screen)
//   - icon-192.png + icon-512.png  (Android / PWA)
//   - site.webmanifest
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "../public");
const IMAGES = resolve(PUBLIC, "images");

const logoBuf = readFileSync(resolve(IMAGES, "logolivro.png"));
const logoDataUrl = `data:image/png;base64,${logoBuf.toString("base64")}`;

// Brand colors (Pernambuco palette)
const BG = "#EBC926"; // amarelo
const FG = "#1A1A1A"; // tinta

// Small icons (16/32): big "L" — readable at tiny sizes.
function makeLetterIconSvg(size) {
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.78);
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="Impact, Arial Black, sans-serif" font-weight="900"
        font-size="${fontSize}" fill="${FG}">L</text>
</svg>
`;
}

// Large icons (180+): full logo "sticker" look.
function makeLogoIconSvg(size, padding = 0.14) {
  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${BG}"/>
  <image href="${logoDataUrl}" x="${pad}" y="${pad}" width="${inner}" height="${inner}" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

function renderPng(svg, size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: BG,
  });
  return resvg.render().asPng();
}

const targets = [
  { name: "favicon-32.png", size: 32, kind: "letter" },
  { name: "favicon-16.png", size: 16, kind: "letter" },
  { name: "apple-touch-icon.png", size: 180, kind: "logo" },
  { name: "icon-192.png", size: 192, kind: "logo" },
  { name: "icon-512.png", size: 512, kind: "logo" },
];

for (const t of targets) {
  const svg = t.kind === "letter" ? makeLetterIconSvg(t.size) : makeLogoIconSvg(t.size);
  const png = renderPng(svg, t.size);
  const out = resolve(PUBLIC, t.name);
  writeFileSync(out, png);
  console.log(`✓ ${t.name} (${png.length} bytes)`);
}

// Web manifest for Android home-screen / PWA
const manifest = {
  name: "Livroteca Brincante do Pina",
  short_name: "Livroteca",
  description:
    "Cultura, leitura e brincadeira no coração do Bode — Pina, Recife.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: BG,
  theme_color: BG,
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};
writeFileSync(
  resolve(PUBLIC, "site.webmanifest"),
  JSON.stringify(manifest, null, 2) + "\n"
);
console.log(`✓ site.webmanifest`);
