import { normSection, roofZ, shedLowBearings } from '../src/lib/model.js';
import { edges } from '../src/lib/geometry.js';
import { edgeOutwardAz } from '../src/lib/geo.js';

const points = [
  { x: -5, y: -3 },
  { x: 5, y: -3 },
  { x: 5, y: 3 },
  { x: -5, y: 3 },
];

console.log('bearings', shedLowBearings(points));
const ang = 20 * Math.PI / 180;
const rot = (p) => ({ x: p.x * Math.cos(ang) - p.y * Math.sin(ang), y: p.x * Math.sin(ang) + p.y * Math.cos(ang) });
const turned = points.map(rot);
console.log('turned bearings', shedLowBearings(turned));
for (const az of [74, 254, 90, 180]) {
  const s = normSection({ id: 'r', points: turned, roofType: 'shed', pitch: 25, height: 3, slopeAz: az });
  let levelEave = 0;
  let gap = 0;
  for (const e of edges(s.poly)) {
    const za = roofZ(s, e.a.x, e.a.y);
    const zb = roofZ(s, e.b.x, e.b.y);
    if (Math.abs(za - 3) < 0.02 && Math.abs(zb - 3) < 0.02) levelEave++;
    if (Math.abs(za - zb) > 0.05 && Math.min(za, zb) > 3.05) gap++;
  }
  console.log('turned', az, '->', s.slopeAz, 'level eaves', levelEave, 'sloped-but-not-from-eave', gap);
}

for (const az of [90, 180, 270, 0, 74]) {
  const s = normSection({ id: 't', points, roofType: 'shed', pitch: 25, height: 3, slopeAz: az });
  const fr = s.frame;
  console.log('\nslopeAz', az, '-> snapped', s.slopeAz, 'rise', fr.rise.toFixed(2));
  for (const e of edges(s.poly)) {
    const za = roofZ(s, e.a.x, e.a.y);
    const zb = roofZ(s, e.b.x, e.b.y);
    const out = edgeOutwardAz(e);
    const kind = Math.abs(za - zb) < 0.02 ? (za > 3.01 ? 'vertical' : 'eave') : 'trapezoid';
    console.log(`  len ${e.length.toFixed(1)} out ${out} ${kind} za=${za.toFixed(2)} zb=${zb.toFixed(2)}`);
  }
}
