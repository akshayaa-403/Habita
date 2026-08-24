// assets/build-android-icons.js
// One-shot: (re)generate all Android launcher icons from assets/icon.png as
// FULL-BLEED adaptive + legacy icons — the 2x2 colour grid fills the whole icon
// with no white padding, and the launcher mask is cut straight from the squares.
//
// Regenerate the master first with `node assets/make-icon.js` if you change the
// design, then run this: `node assets/build-android-icons.js`.

const sharp = require('sharp');
const path = require('path');

const BASE = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const MASTER = path.join(__dirname, 'icon.png');

// Adaptive foreground uses the 108dp canvas; legacy uses the icon's own dp size.
const ADAPTIVE = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LEGACY = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

async function run() {
  for (const [d, s] of Object.entries(ADAPTIVE)) {
    const out = path.join(BASE, 'mipmap-' + d, 'ic_launcher_foreground.png');
    await sharp(MASTER).resize(s, s, { fit: 'cover' }).png().toFile(out);
  }
  for (const [d, s] of Object.entries(LEGACY)) {
    const dir = path.join(BASE, 'mipmap-' + d);
    await sharp(MASTER).resize(s, s, { fit: 'cover' }).png().toFile(path.join(dir, 'ic_launcher.png'));
    const mask = Buffer.from(
      `<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="white"/></svg>`
    );
    const img = await sharp(MASTER).resize(s, s, { fit: 'cover' }).png().toBuffer();
    await sharp(img).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(path.join(dir, 'ic_launcher_round.png'));
  }
  console.log('Regenerated full-bleed Android launcher icons from assets/icon.png');
  console.log('Note: adaptive XML (mipmap-anydpi-v26) and @color/ic_launcher_background are already set up.');
}

run().catch((e) => { console.error(e); process.exit(1); });
