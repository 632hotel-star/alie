// One-time build helper: split the traced statue path into its closed subpaths so the crown leaves,
// hair, face and drape can be addressed separately (leaf-by-leaf reveal, shade regions).
// Usage: node tools/split-statue.mjs <statue-path.txt> <out.json>  (writes {subpaths:[{i,d,bbox}]})
import { readFileSync, writeFileSync } from 'node:fs';
const [,, src, out] = process.argv;
const d = readFileSync(src, 'utf8').trim();
const parts = d.split(/(?<=Z)(?=M)/);
const num = /-?\d+(?:\.\d+)?/g;
const subpaths = parts.map((p, i) => {
  const nums = (p.match(num) || []).map(Number);
  const xs = nums.filter((_, k) => k % 2 === 0), ys = nums.filter((_, k) => k % 2 === 1);
  const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(v => Math.round(v));
  return { i, d: p, bbox, cx: Math.round((bbox[0] + bbox[2]) / 2), cy: Math.round((bbox[1] + bbox[3]) / 2), area: (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) };
});
writeFileSync(out, JSON.stringify({ subpaths }, null, 1));
console.log(subpaths.map(s => `${s.i}: bbox ${s.bbox.join(',')} area ${s.area}`).join('\n'));
