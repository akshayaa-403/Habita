// scripts/build.js
// Copies the authored web app from src/ into www/, the directory Capacitor
// treats as the web build output (capacitor.config.json -> "webDir": "www").
//
// There is no bundler: the app is plain HTML/CSS/JS loaded via ordered <script>
// tags, so "building" is just a clean copy. Run it before `cap sync` (the npm
// scripts do this for you) and before the tests, which load www/index.html.
//
// Usage: node scripts/build.js

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'www');

if (!fs.existsSync(SRC)) {
  console.error(`[build] src/ not found at ${SRC}`);
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });
console.log('[build] Copied src/ -> www/');
