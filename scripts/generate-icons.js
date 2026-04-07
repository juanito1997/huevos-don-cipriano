/**
 * Generates PWA icons (192x192 and 512x512) from /public/img/logo.png
 * Uses the Playwright bundled Node + sharp (if available), else falls back
 * to copying the logo as-is with a note.
 *
 * Run once: node scripts/generate-icons.js
 */
const path = require("path");
const fs   = require("fs");

const SRC    = path.join(__dirname, "../public/img/logo.png");
const OUTDIR = path.join(__dirname, "../public/icons");

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

try {
  const sharp = require("sharp");

  Promise.all([
    sharp(SRC).resize(192, 192).toFile(path.join(OUTDIR, "icon-192.png")),
    sharp(SRC).resize(512, 512).toFile(path.join(OUTDIR, "icon-512.png")),
  ]).then(() => {
    console.log("✅  Icons generated: icon-192.png, icon-512.png");
  }).catch((err) => {
    console.error("Error generating icons with sharp:", err.message);
    fallback();
  });
} catch {
  // sharp not available — just copy the logo
  fallback();
}

function fallback() {
  const data = fs.readFileSync(SRC);
  fs.writeFileSync(path.join(OUTDIR, "icon-192.png"), data);
  fs.writeFileSync(path.join(OUTDIR, "icon-512.png"), data);
  console.log("✅  Icons copied (resize manually if needed): icon-192.png, icon-512.png");
}
