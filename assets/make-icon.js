// assets/make-icon.js
// Generates the master Habita app icon (assets/icon.png) as a crisp 1024x1024
// image matching the Habita logo: a 2x2 grid of rounded colour tiles with small
// gaps, overlaid by a faint grey clock ring and two grey hands forming a soft V.
// Transparent background, no text — just the mark.
//
//   [red   ][blue ]
//   [yellow][green]
//
// Run: node assets/make-icon.js   (then `npm run icons` to fan out densities)

const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;
const COLORS = {
  red: '#EE544F',
  blue: '#00B9D5',
  yellow: '#FBB028',
  green: '#01C0A6',
};
// Clock is grey, matching the logo. Ring is a very faint light grey/white.
const HAND = '#6f7276';
const RING = '#ffffff';

// Tiles fill the whole frame (so a launcher mask never reveals a background),
// separated by a small gap and given gently rounded corners like the logo.
const GAP = 22;          // gap between tiles
const RADIUS = 46;       // corner radius of each tile
const half = SIZE / 2;
const cx = SIZE / 2;
const cy = SIZE / 2;
const tile = half - GAP / 2;

// Clock geometry — centred, sized to sit safely inside the adaptive-icon crop.
const ringR = SIZE * 0.235;   // radius of the clock ring
const ringW = SIZE * 0.032;   // ring stroke width
const handW = SIZE * 0.05;    // hand thickness

function rect(x, y, fill) {
  return `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${RADIUS}" ry="${RADIUS}" fill="${fill}"/>`;
}

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- 2x2 rounded tiles with a small gap -->
  ${rect(0, 0, COLORS.red)}
  ${rect(half + GAP / 2, 0, COLORS.blue)}
  ${rect(0, half + GAP / 2, COLORS.yellow)}
  ${rect(half + GAP / 2, half + GAP / 2, COLORS.green)}

  <!-- Faint clock ring -->
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${RING}" stroke-width="${ringW}" opacity="0.45"/>

  <!-- Clock hands forming a soft V / checkmark, meeting slightly below centre:
       hour points up-left, minute points up-right, both from the low joint. -->
  <g stroke="${HAND}" stroke-width="${handW}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M ${cx - ringR * 0.60} ${cy - ringR * 0.42}
             L ${cx} ${cy + ringR * 0.30}
             L ${cx + ringR * 0.66} ${cy - ringR * 0.30}"/>
  </g>
  <circle cx="${cx}" cy="${cy + ringR * 0.30}" r="${handW * 0.62}" fill="${HAND}"/>
</svg>`;

const out = path.join(__dirname, 'icon.png');
sharp(Buffer.from(svg))
  .png()
  .toFile(out)
  .then((info) => console.log(`Wrote ${out} (${info.width}x${info.height})`))
  .catch((err) => { console.error(err); process.exit(1); });
