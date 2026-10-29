import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
await rm('.dist',{recursive:true,force:true});
await mkdir('.dist',{recursive:true});
for(const file of ['index.html','styles.css','script.js','analytics-tracker.js','analytics-google.js','assets','analytics'])await cp(file,`.dist/${file}`,{recursive:true});
await writeFile('.dist/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
await writeFile('.dist/_headers',`/analytics/*\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'\n`);
console.log('Built static website and dashboard in .dist.');
