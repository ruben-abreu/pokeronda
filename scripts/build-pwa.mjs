import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root='dist/client';
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?walk(join(dir,e.name)):join(dir,e.name)))).flat();}
const files=(await walk(join(root,'_next/static'))).filter(p=>/\.(js|css|woff2?)$/.test(p));
files.push(...['icon-192.png','icon-512.png','apple-touch-icon.png','favicon.svg','manifest.webmanifest','offline.html'].map(p=>join(root,p)));
files.sort();const template=await readFile('public/sw.js','utf8');const hash=createHash('sha256').update(template);
for(const file of files)hash.update(await readFile(file));
const assets=files.map(p=>'/'+relative(root,p));
await writeFile(join(root,'sw.js'),template.replace('__PWA_VERSION__',hash.digest('hex').slice(0,16)).replace('__PWA_ASSETS__',JSON.stringify(assets)));
console.log(`PWA: ${assets.length} assets prepared for offline use.`);
