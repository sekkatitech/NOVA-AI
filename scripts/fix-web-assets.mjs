// After `expo export --platform web`: move dist/assets/node_modules to dist/assets/vendor,
// rename scoped package folders (@expo → at-expo), and rewrite the bundle's paths.
// Netlify's drag-and-drop upload skips folders named node_modules and folders whose names
// start with "@", which dropped the icon fonts (blank menu icons in the browser build).
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const from = join(dist, 'assets', 'node_modules');
const vendor = join(dist, 'assets', 'vendor');

if (existsSync(from)) renameSync(from, vendor);

const replacements = [['/assets/node_modules/', '/assets/vendor/']];
if (existsSync(vendor)) {
  for (const entry of readdirSync(vendor, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('@')) {
      const safe = `at-${entry.name.slice(1)}`;
      renameSync(join(vendor, entry.name), join(vendor, safe));
      replacements.push([`/assets/vendor/${entry.name}/`, `/assets/vendor/${safe}/`]);
    }
  }
}

function rewrite(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) rewrite(path);
    else if (/\.(js|html|json|css)$/.test(entry.name)) {
      const text = readFileSync(path, 'utf8');
      let fixed = text;
      // Bundles may write the path with an escaped slash (\/), so cover both spellings.
      for (const [a, b] of replacements) {
        fixed = fixed.replaceAll(a, b).replaceAll(a.replaceAll('/', '\\/'), b.replaceAll('/', '\\/'));
      }
      if (fixed !== text) writeFileSync(path, fixed);
    }
  }
}
rewrite(dist);

// Fail the build if anything is still under a folder the upload would skip.
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name.startsWith('@')) {
      throw new Error(`Folder Netlify drag-and-drop would skip: ${join(dir, entry.name)}`);
    }
    check(join(dir, entry.name));
  }
}
check(dist);

writeFileSync(join(dist, '_redirects'), '/*  /index.html  200\n');
console.log('Web assets moved to dist/assets/vendor (scoped folders renamed)');
