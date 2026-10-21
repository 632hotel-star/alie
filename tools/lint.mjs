// Content lint for the landing page: no em/en dashes, no Arabic-Indic digits, gold only where allowed,
// no scroll listeners, no setInterval, no external resources. Run: node tools/lint.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const files = [];
const walk = d => readdirSync(d).forEach(f => { const p = join(d, f); if (f.startsWith('.') || f === 'node_modules' || f === 'tools' || f === 'fonts') return; if (statSync(p).isDirectory()) walk(p); else if (/\.(html|css|js)$/.test(f) && !f.startsWith('_')) files.push(p); });
walk(root);
let bad = 0;
const report = (f, msg) => { bad++; console.log(`${f.replace(root, '')}: ${msg}`); };
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  const lines = s.split('\n');
  lines.forEach((l, i) => {
    if (/[–—]/.test(l)) report(f, `line ${i + 1}: em/en dash`);
    if (/[٠-٩۰-۹]/.test(l)) report(f, `line ${i + 1}: Arabic-Indic digit`);
    if (/addEventListener\(\s*['"]scroll['"]/.test(l)) report(f, `line ${i + 1}: scroll listener`);
    if (/setInterval\(/.test(l)) report(f, `line ${i + 1}: setInterval`);
    if (/https?:\/\/(?!www\.w3\.org)/.test(l) && !/site\.config|README|rel="noopener"|cfg\./.test(l) && /\.(html|css|js)$/.test(f) && !/^\s*(\/\/|\/\*|\*)/.test(l) && !/apps\.apple|placeholder|e\.g\./.test(l)) report(f, `line ${i + 1}: external URL: ${l.trim().slice(0, 80)}`);
  });
  if (/\.css$/.test(f) && !/tokens\.css$/.test(f)) {
    // gold tokens may only appear in the procession's fifth figure rules
    lines.forEach((l, i) => { if (/--gold/.test(l) && !/data-stage="4"|rig\[data-state="5"\]|\[data-state="5"\]|evo-|--i:4/.test(l)) report(f, `line ${i + 1}: gold used outside the fifth figure: ${l.trim().slice(0, 90)}`); });
  }
}
console.log(bad ? `\n${bad} issue(s)` : `clean: ${files.length} files`);
process.exit(bad ? 1 : 0);
