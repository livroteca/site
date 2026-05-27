// Generate the default Open Graph image (1200x630 PNG).
// Run: pnpm --filter site gen:og
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "../public/images");

const logoBuf = readFileSync(resolve(PUBLIC, "logolivro.png"));
const logoB64 = logoBuf.toString("base64");
const logoDataUrl = `data:image/png;base64,${logoB64}`;

const W = 1200;
const H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#1A1A1A" fill-opacity="0.06"/>
    </pattern>
  </defs>

  <!-- Yellow paper background -->
  <rect width="${W}" height="${H}" fill="#EBC926"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- Riso shadow rectangles: green offset bottom-right, red offset top-left -->
  <rect x="105" y="105" width="1010" height="460" fill="#4A7C3A"/>
  <rect x="75" y="75" width="1010" height="460" fill="#C03E2D"/>

  <!-- Paper card centered between the two shadows -->
  <rect x="90" y="90" width="1010" height="460" fill="#FAF7F0" stroke="#1A1A1A" stroke-width="4"/>

  <!-- Logo (left side) -->
  <image href="${logoDataUrl}" x="140" y="170" width="280" height="280" preserveAspectRatio="xMidYMid meet"/>

  <!-- Vertical divider -->
  <line x1="470" y1="170" x2="470" y2="450" stroke="#1A1A1A" stroke-width="3"/>

  <!-- Tagline (right side) -->
  <g transform="translate(520, 220)">
    <text font-family="Impact, Arial Black, Helvetica, sans-serif" font-weight="900" font-size="68" fill="#1A1A1A" letter-spacing="0.5">
      <tspan x="0" y="0">CULTURA,</tspan>
      <tspan x="0" y="78">LEITURA,</tspan>
      <tspan x="0" y="156">BRINCADEIRA</tspan>
    </text>
  </g>

  <!-- Tagline accent -->
  <text x="520" y="440" font-family="Impact, Arial Black, Helvetica, sans-serif" font-weight="900" font-size="44" fill="#C03E2D" letter-spacing="1">O BODE É O BIXO.</text>

  <!-- Bottom location chip -->
  <g transform="translate(86, 568)">
    <rect width="320" height="40" fill="#1A1A1A"/>
    <text x="20" y="28" font-family="Impact, Arial Black, sans-serif" font-size="22" fill="#FAF7F0" letter-spacing="2">
      BODE · PINA · RECIFE
    </text>
  </g>

  <!-- "Since 1997" small chip on right -->
  <g transform="translate(940, 568)">
    <rect width="156" height="40" fill="#C03E2D"/>
    <text x="20" y="28" font-family="Impact, Arial Black, sans-serif" font-size="22" fill="#FAF7F0" letter-spacing="2">
      DESDE 1997
    </text>
  </g>
</svg>
`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: W },
  background: "#EBC926",
  font: {
    loadSystemFonts: true,
    defaultFontFamily: "Impact",
  },
  shapeRendering: 2,
  textRendering: 2,
  imageRendering: 0,
});

const png = resvg.render().asPng();
const out = resolve(PUBLIC, "og-default.png");
writeFileSync(out, png);
console.log(`✓ Wrote ${out} (${png.length} bytes)`);
