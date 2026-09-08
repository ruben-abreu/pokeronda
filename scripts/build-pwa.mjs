import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'dist/client';
async function walk(dir) {
 const entries = await readdir(dir, { withFileTypes: true });
 return (await Promise.all(entries.map(e => e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name)))).flat();
}
const files = (await walk(root)).filter(p => /\.(js|css|woff2?|html|png|svg|webmanifest)$/.test(p) && !p.endsWith('/sw.js')).sort();
const template = await readFile('public/sw.js', 'utf8');
const hash = createHash('sha256').update(template);
for (const file of files) hash.update(await readFile(file));
const assets = files.map(p => '/' + relative(root, p)).filter(p => p !== '/index.html');
await writeFile(join(root, 'sw.js'), template.replace('__PWA_VERSION__', hash.digest('hex').slice(0, 16)).replace('__PWA_ASSETS__', JSON.stringify(assets)));
console.log(`PWA: ${assets.length} static assets prepared for offline use.`);
