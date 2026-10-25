// After `expo export --platform web`: move dist/assets/node_modules to dist/assets/vendor and
// rewrite the bundle's paths. Netlify's drag-and-drop upload skips every folder named
// node_modules, which dropped the icon fonts (blank menu icons in the browser build).
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const from = join(dist, 'assets', 'node_modules');
const to = join(dist, 'assets', 'vendor');

if (existsSync(from)) renameSync(from, to);

function rewrite(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) rewrite(path);
    else if (/\.(js|html|json|css)$/.test(entry.name)) {
      const text = readFileSync(path, 'utf8');
      const fixed = text.replaceAll('/assets/node_modules/', '/assets/vendor/');
      if (fixed !== text) writeFileSync(path, fixed);
    }
  }
}
rewrite(dist);

writeFileSync(join(dist, '_redirects'), '/*  /index.html  200\n');
console.log('Web assets moved to dist/assets/vendor');
