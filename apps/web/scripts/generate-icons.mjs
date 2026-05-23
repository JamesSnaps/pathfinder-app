import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");

function makeSvg(size) {
  const r = Math.round(size * 0.18); // corner radius
  const cx = size / 2;
  const cy = size / 2;
  // Compass needle proportions
  const outerR = size * 0.33;
  const innerR = size * 0.09;
  const tipDist = size * 0.33;
  const baseDist = size * 0.13;

  // North pointer (white, pointing up-right at 315°)
  const sin45 = Math.SQRT1_2;
  // Arrow tip at top-right, base at bottom-left
  const tipX = cx + tipDist * sin45;
  const tipY = cy - tipDist * sin45;
  const baseX = cx - baseDist * sin45;
  const baseY = cy + baseDist * sin45;
  const perpX = -sin45 * innerR;
  const perpY = -sin45 * innerR;

  // North (bright white) half of the diamond
  const n1x = tipX;
  const n1y = tipY;
  const n2x = cx + perpX;
  const n2y = cy + perpY;
  const n3x = baseX;
  const n3y = baseY;
  const n4x = cx - perpX;
  const n4y = cy - perpY;

  // South pointer (dimmer, pointing bottom-left)
  const s1x = cx - tipDist * sin45;
  const s1y = cy + tipDist * sin45;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#2d7d52"/>
  <!-- Subtle ring -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" stroke="rgba(255,255,255,0.2)" stroke-width="${size * 0.025}" fill="none"/>
  <!-- South arrow (muted) -->
  <polygon points="${s1x},${s1y} ${n2x},${n2y} ${baseX},${baseY} ${n4x},${n4y}" fill="rgba(255,255,255,0.35)"/>
  <!-- North arrow (bright) -->
  <polygon points="${n1x},${n1y} ${n2x},${n2y} ${baseX},${baseY} ${n4x},${n4y}" fill="white"/>
  <!-- Center dot -->
  <circle cx="${cx}" cy="${cy}" r="${size * 0.035}" fill="white"/>
</svg>`;
}

async function generate(size, filename) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(join(publicDir, filename));
  console.log(`Generated ${filename}`);
}

await generate(192, "icon-192.png");
await generate(512, "icon-512.png");
console.log("Done.");
