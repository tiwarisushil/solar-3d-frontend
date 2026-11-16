'use client';

// Full-bleed 2D editor drawn in SVG over satellite imagery (local metres, north up).

import { buildingIdOf, buildingList, isMainSection, mainSection, sectionsOf } from '@/lib/buildings';
import { useEffect, useMemo, useRef, useState } from 'react';
import { azimuthsMatch, DEG, edgeOutwardAz } from '@/lib/geo';
import { dist, edges, pointInPolygon, polygonArea, polygonCentroid, rectPoly } from '@/lib/geometry';
import { addBase, togglePanelAt, withinPackage } from '@/lib/autofill';
import { stringPaint, stringStroke } from '@/lib/strings';
import { blockOutline, computeDragGuides, isCylinder, magnetize, newId, normSection, planeAt, resizeBase, ridgeSegment, roofClearance, roofPlanes, shedEdgeKind, snapSlopeAz, slotAt, slotsBetween, topSection, PATH_COLORS } from '@/lib/model';
import { staticMapSize, staticMapUrl } from '@/lib/staticMap';
import { useStore } from '@/lib/store';

const BLUE = '#2f5bea';
const ORANGE = '#f5a524';

/** The building a new raised roof belongs to: the one whose roof lies under `point`, else the one being edited. */
function roofUnder(state, point) {
  const hit = state.sections.find((s) => s.points.length >= 3 && pointInPolygon(point, s.points));
  const active = buildingList(state.buildings).find((b) => b.id === state.buildingId) || buildingList(state.buildings)[0];
  const building = hit ? buildingIdOf(hit, state.buildings) : active.id;
  return { building, main: mainSection(state.sections, state.buildings, building) };
}

const DECK_RISE = { stair: 2, lift: 2.5, floor: 2.7 };
const DECK_NAME = { stair: 'Staircase room', lift: 'Lift room' };

/** A staircase room, lift room or roof on roof: a flat slab above whatever roof it stands on. */
function addFlatDeck(s, key, points) {
  const kind = key === 'stair' || key === 'lift' ? key : 'floor';
  const under = roofUnder(s, polygonCentroid(points));
  const rise = Math.max(0.2, Number(s.pendingBlock?.h) || DECK_RISE[kind]);
  const name = kind === 'floor' ? `Roof on roof ${sectionsOf(s.sections, s.buildings, under.building).length}` : DECK_NAME[kind];
  s.addSection({
    id: newId('r'),
    name,
    deck: kind,
    building: under.building,
    points,
    height: roofClearance(s.sections, points) + rise,
    roofType: 'flat',
    parapetH: 0,
    parapetT: 0.23,
  });
  s.set({ pendingKey: null, pendingBlock: null });
}

function snapPoint(raw, pts, scale) {
  const tol = 12 / scale;
  if (pts.length >= 3 && dist(raw, pts[0]) < tol) return { p: pts[0], close: true, guides: [] };
  let p = raw;
  const guides = [];
  if (pts.length >= 2) {
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    const base = Math.atan2(b.y - a.y, b.x - a.x);
    const ang = Math.atan2(raw.y - b.y, raw.x - b.x);
    const len = dist(raw, b);
    const rel = ((ang - base) / (Math.PI / 2));
    const near = Math.round(rel);
    if (Math.abs(rel - near) < 0.09) {
      const s = base + (near * Math.PI) / 2;
      const l = len * Math.cos(ang - s);
      p = { x: b.x + Math.cos(s) * l, y: b.y + Math.sin(s) * l };
      guides.push({ a: b, dir: s, square: near % 2 !== 0 ? b : null, prev: a });
      // also align with the first point along the edge axes
      const f = pts[0];
      for (const axis of [base, base + Math.PI / 2]) {
        const nx = -Math.sin(axis);
        const ny = Math.cos(axis);
        const d = (p.x - f.x) * nx + (p.y - f.y) * ny;
        const along = Math.abs(Math.cos(s - axis));
        if (Math.abs(d) < tol && along > 0.9) {
          p = { x: p.x - nx * d, y: p.y - ny * d };
          guides.push({ a: f, dir: axis });
        }
      }
    }
  }
  return { p, close: false, guides };
}

function EdgeLabel({ a, b, toS, color = '#111827' }) {
  const l = dist(a, b);
  if (l < 0.4) return null;
  const A = toS(a);
  const B = toS(b);
  if (Math.hypot(B.x - A.x, B.y - A.y) < 46) return null;
  let deg = (Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const text = `${l.toFixed(2)} m`;
  return (
    <g transform={`translate(${mx} ${my}) rotate(${deg})`} pointerEvents="none">
      <rect x={-text.length * 3.6 - 5} y={-10} width={text.length * 7.2 + 10} height={20} rx={4} fill={color} opacity="0.88" />
      <text textAnchor="middle" y={4} fontSize="12" fontWeight="600" fill="#fff">
        {text}
      </text>
    </g>
  );
}

const AMBER = '#f59e0b';
const azOf = (e) => edgeOutwardAz(e);

/** Hip / Kerala roof overlay: the roof's edge, every slope outlined (ridges, hips, valleys) with a downhill arrow. */
function HipMarks({ sec, toS }) {
  const planes = roofPlanes(sec);
  const pts = (poly) => poly.map((p) => { const q = toS(p); return `${q.x},${q.y}`; }).join(' ');
  return (
    <g pointerEvents="none">
      {sec.frame.roofPoly && <polygon points={pts(sec.frame.roofPoly)} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.8} />}
      {planes.map((pl, i) => <polygon key={`p${i}`} points={pts(pl.poly)} fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" opacity={0.9} />)}
      {planes.filter((pl) => polygonArea(pl.poly) > 4).map((pl, i) => {
        const c = polygonCentroid(pl.poly);
        const r = (pl.azimuth * Math.PI) / 180;
        const from = toS({ x: c.x - Math.sin(r) * 0.7, y: c.y - Math.cos(r) * 0.7 });
        const to = toS({ x: c.x + Math.sin(r) * 0.7, y: c.y + Math.cos(r) * 0.7 });
        const ang = Math.atan2(to.y - from.y, to.x - from.x);
        const head = (d) => `${to.x - 10 * Math.cos(ang + d)},${to.y - 10 * Math.sin(ang + d)}`;
        return (
          <g key={`a${i}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
            <polygon points={`${to.x},${to.y} ${head(0.45)} ${head(-0.45)}`} fill="#fff" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Sloped roof overlay: ridge (dashed), a downhill arrow with the pitch on every slope, and the low
 * edges in amber. With `edit`, the roof is adjusted right on the picture: click an edge to make it the
 * low side, drag the dot to move a gable's ridge.
 */
function SlopeMarks({ section, toS, edit, onLowEdge, onRidgeDown }) {
  const sec = normSection(section);
  if (!sec.frame) return null;
  if (sec.frame.hip || sec.frame.plane) return <HipMarks sec={sec} toS={toS} />;
  const ridge = ridgeSegment(sec);
  const gable = sec.roofType === 'gable';
  const isLow = (e) => (sec.roofType === 'shed' ? shedEdgeKind(sec, e.a, e.b) === 'low' : azimuthsMatch(azOf(e), sec.frame.az) || (gable && azimuthsMatch(azOf(e), sec.frame.az + 180)));
  const roofEdges = edges(sec.poly).filter((e) => e.length >= 0.8);
  const mid = ridge && toS({ x: (ridge[0].x + ridge[1].x) / 2, y: (ridge[0].y + ridge[1].y) / 2 });
  return (
    <g>
      {roofEdges.map((e, i) => {
        const a = toS(e.a);
        const b = toS(e.b);
        const low = isLow(e);
        return (
          <g key={i}>
            {low && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={AMBER} strokeWidth={6} strokeLinecap="round" pointerEvents="none" />}
            {/* wide invisible target so an edge is easy to hit */}
            {edit && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={22} strokeLinecap="round" className={low ? 'stroke-transparent' : 'cursor-pointer stroke-transparent hover:stroke-amber-400/60'} onPointerDown={(ev) => { ev.stopPropagation(); if (!low || gable) onLowEdge(azOf(e)); }}><title>{low ? 'Low edge of the roof' : 'Click to make this the low edge'}</title></line>}
            {low && <text x={(a.x + b.x) / 2 + e.outward.x * 16} y={(a.y + b.y) / 2 - e.outward.y * 16 + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={AMBER} stroke="#0f172a" strokeWidth={3} paintOrder="stroke" pointerEvents="none">LOW EDGE</text>}
          </g>
        );
      })}
      <g pointerEvents="none">
        {ridge && <line x1={toS(ridge[0]).x} y1={toS(ridge[0]).y} x2={toS(ridge[1]).x} y2={toS(ridge[1]).y} stroke="#fff" strokeWidth={3} strokeDasharray="8 6" />}
        {roofPlanes(sec).map((pl) => {
          const c = polygonCentroid(pl.poly);
          const r = (pl.azimuth * Math.PI) / 180;
          const from = toS({ x: c.x - Math.sin(r) * 0.9, y: c.y - Math.cos(r) * 0.9 });
          const to = toS({ x: c.x + Math.sin(r) * 0.9, y: c.y + Math.cos(r) * 0.9 });
          const ang = Math.atan2(to.y - from.y, to.x - from.x);
          const head = (d) => `${to.x - 11 * Math.cos(ang + d)},${to.y - 11 * Math.sin(ang + d)}`;
          return (
            <g key={pl.azimuth}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
              <polygon points={`${to.x},${to.y} ${head(0.45)} ${head(-0.45)}`} fill="#fff" />
              <text x={from.x} y={from.y - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" stroke="#0f172a" strokeWidth={3} paintOrder="stroke">{Math.round(pl.tilt)}° down</text>
            </g>
          );
        })}
      </g>
      {edit && mid && (
        <g style={{ cursor: 'grab' }} onPointerDown={onRidgeDown}>
          <circle cx={mid.x} cy={mid.y} r={16} fill="transparent" />
          <circle cx={mid.x} cy={mid.y} r={9} fill="#fff" stroke="#0f172a" strokeWidth={2.5} />
          <text x={mid.x + 16} y={mid.y + 4} textAnchor="start" fontSize={11} fontWeight={700} fill="#fff" stroke="#0f172a" strokeWidth={3} paintOrder="stroke" pointerEvents="none">RIDGE · drag</text>
        </g>
      )}
    </g>
  );
}

export default function Editor2D({ design, showPanels = true, showObjects = true, editSections = false, editRaised = false, slopeEdit = false, stringColors = null, stringPath = null, children }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  const [view, setView] = useState({ cx: 0, cy: 0, scale: 14 });
  const [draft, setDraft] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [area, setArea] = useState(null); // rectangle being dragged with the mark-area tool
  const [baseDraft, setBaseDraft] = useState(null); // the base being dragged out with the add-base tool
  const [dragGuides, setDragGuides] = useState(null); // Canva-style align + gap guides while moving a base
  const drag = useRef(null);
  const fitted = useRef(false);

  const origin = useStore((s) => s.origin);
  const tool = useStore((s) => s.tool);
  const selectedId = useStore((s) => s.selectedId);
  const sections = useStore((s) => s.sections);
  const buildings = useStore((s) => s.buildings);
  const activeBuilding = useStore((s) => s.buildingId);
  const currentBuilding = buildingList(buildings).some((b) => b.id === activeBuilding) ? activeBuilding : buildingList(buildings)[0].id;
  const objects = useStore((s) => s.objects);
  const config = useStore((s) => s.config);
  const structuresOnly = useStore((s) => s.structuresOnly);
  const st = useStore.getState;

  // older drawings kept the lift and staircase as obstacles. They are flat roofs now, so panels can sit on them.
  const deckBlocks = objects.filter((o) => o.type === 'block' && (/^lift room$/i.test(o.name || '') || /^staircase room$/i.test(o.name || ''))).map((o) => o.id).join();
  const untaggedRoofs = sections.some((sec) => !sec.deck && /^roof on roof/i.test(sec.name || ''));
  useEffect(() => {
    const s = st();
    if (!s.sections.length) return;
    const kindOf = (name) => (/^lift room$/i.test(name || '') ? 'lift' : /^staircase room$/i.test(name || '') ? 'stair' : null);
    const blocks = s.objects.filter((o) => o.type === 'block' && kindOf(o.name));
    const tag = s.sections.some((sec) => !sec.deck && /^roof on roof/i.test(sec.name || ''));
    if (!blocks.length && !tag) return;
    let next = s.sections.map((sec) => (!sec.deck && /^roof on roof/i.test(sec.name || '') ? { ...sec, deck: 'floor', roofType: 'flat', parapetH: 0 } : sec));
    const drop = new Set();
    for (const b of blocks) {
      const points = b.points?.length >= 3 ? b.points : rectPoly(b.x, b.y, Math.max(0.4, b.w || 3), Math.max(0.4, b.d || 3), b.rot || 0);
      const kind = kindOf(b.name);
      const under = roofUnder({ ...s, sections: next }, polygonCentroid(points));
      next = [...next, { id: b.id, name: b.name, deck: kind, building: under.building, points, height: roofClearance(next, points) + Math.max(0.2, b.h || DECK_RISE[kind]), roofType: 'flat', parapetH: 0, parapetT: 0.23 }];
      drop.add(b.id);
    }
    s.set({ sections: next, objects: drop.size ? s.objects.filter((o) => !drop.has(o.id)) : s.objects, layoutKey: '' });
  }, [deckBlocks, untaggedRoofs, st]);

  useEffect(() => {
    const el = ref.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fit to roof once
  useEffect(() => {
    if (fitted.current || size.w < 50) return;
    fitted.current = true;
    const pts = sections.flatMap((s) => s.points);
    if (!pts.length) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs) || 20;
    const h = Math.max(...ys) - Math.min(...ys) || 20;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView({ cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2, scale: Math.min(size.w / (w * 1.9), size.h / (h * 1.7)) });
  }, [size, sections]);

  const toS = (p) => ({ x: (p.x - view.cx) * view.scale + size.w / 2, y: (view.cy - p.y) * view.scale + size.h / 2 });
  const toW = (sx, sy) => ({ x: (sx - size.w / 2) / view.scale + view.cx, y: view.cy - (sy - size.h / 2) / view.scale });
  const evW = (e) => {
    const r = ref.current.getBoundingClientRect();
    return toW(e.clientX - r.left, e.clientY - r.top);
  };
  /** The id of the panel at a plan point, or null. */
  const moduleAt = (w) => {
    const t = design.tables.find((k) => pointInPolygon(w, k.poly));
    const slot = t && slotAt(t, w, design.spec);
    const id = slot && `${t.id}:${slot.key}`;
    return id && t.modules.some((m) => m.id === id) ? id : null;
  };
  const pts =(poly) => poly.map((p) => toS(p)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const images = useMemo(() => {
    if (!origin) return [];
    return [18, 20].map((zoom) => ({ zoom, size: staticMapSize(origin.lat, zoom), url: staticMapUrl({ lat: origin.lat, lng: origin.lng, zoom }) }));
  }, [origin]);

  const areaRect = (a, b) => {
    const az = design.defaultAzimuth;
    const f = { x: Math.sin(az * DEG), y: Math.cos(az * DEG) };
    const c = { x: f.y, y: -f.x };
    const du = (b.x - a.x) * c.x + (b.y - a.y) * c.y;
    const dv = (b.x - a.x) * f.x + (b.y - a.y) * f.y;
    const center = { x: a.x + (c.x * du + f.x * dv) / 2, y: a.y + (c.y * du + f.y * dv) / 2 };
    return { center, w: Math.abs(du), d: Math.abs(dv), az, poly: rectPoly(center.x, center.y, Math.abs(du), Math.abs(dv), az) };
  };

  const drawing = tool === 'draw-section' || tool === 'draw-zone';
  const snap = drawing && cursor ? snapPoint(cursor, draft, view.scale) : null;

  const finishDraft = (points) => {
    if (points.length < 3) return;
    const s = st();
    if (tool === 'draw-section') {
      const drawn = { other: ['Other', 'block', 1], tree: ['Tree', 'tree', 6] }[s.pendingKey];
      if (drawn) {
        const [name, kind, h] = drawn;
        const c = polygonCentroid(points);
        if (kind === 'tree') {
          const r = Math.max(0.4, ...points.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
          s.addObject({ id: newId('t'), type: 'tree', name, x: c.x, y: c.y, r, h: s.pendingBlock?.h || h });
        } else {
          s.addObject({ id: newId('b'), type: 'block', name, h: s.pendingBlock?.h || h, points, x: c.x, y: c.y });
        }
        s.set({ pendingKey: null, pendingBlock: null });
        setDraft([]);
        return;
      }
      if (s.pendingKey === 'stair' || s.pendingKey === 'lift' || s.pendingKey === 'floor') {
        addFlatDeck(s, s.pendingKey, points);
      } else if (s.pendingKey === 'building' || !s.sections.length) {
        // the main roof of a building: the design's first one, or a new building on the campus
        const building = s.sections.length ? s.addBuilding() : buildingList(s.buildings)[0].id;
        s.addSection({ id: newId('r'), name: 'Main roof', building, points, height: 6, parapetH: 1, parapetT: 0.23 });
        s.set({ pendingKey: null, buildingId: building });
      } else {
        addFlatDeck(s, 'floor', points);
      }
    } else {
      s.addObject({ id: newId('z'), type: 'zone', points, tilt: config.tilt, azimuth: design.defaultAzimuth, frontLeg: config.frontLeg, rowsPerTable: config.rowsPerTable, orientation: config.orientation, rowGap: config.rowGap });
    }
    setDraft([]);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      const s = st();
      if (drawing) {
        if (e.key === 'Enter') finishDraft(draft);
        else if (e.key === 'Backspace') setDraft((d) => d.slice(0, -1));
        else if (e.key === 'Escape') {
          setDraft([]);
          s.set({ tool: 'select' });
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selectedId) s.remove(s.selectedId);
      else if (e.key === 'Escape') s.set({ selectedId: null, tool: 'select' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onWheel = (e) => {
    const r = ref.current.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const before = toW(sx, sy);
    const scale = Math.min(120, Math.max(1.5, view.scale * Math.exp(-e.deltaY * 0.0015)));
    setView({ scale, cx: before.x - (sx - size.w / 2) / scale, cy: before.y + (sy - size.h / 2) / scale });
  };

  const onDown = (e) => {
    if (e.button !== 0) return;
    const w = evW(e);
    const s = st();
    if (drawing) {
      // a click adds a corner, a drag pans the picture
      drag.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, view, click: w };
      ref.current.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'mark-area') {
      drag.current = { kind: 'area', start: w };
      ref.current.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'add-tree') return s.addObject({ id: newId('t'), type: 'tree', x: w.x, y: w.y, r: 2.5, h: 8 });
    if (tool === 'add-block') return s.addObject({ id: newId('b'), type: 'block', name: 'Water tank', w: 2, d: 2, h: 1.8, ...(s.pendingBlock || {}), x: w.x, y: w.y, rot: design.defaultAzimuth });
    if (tool === 'string') {
      // the string tool: tap a panel to put it in the open string (or start one), or press and
      // drag across panels to add them in that order; starting on a panel of the open string takes
      // panels out instead. Starting off the panels pans the plan as usual.
      const id = moduleAt(w);
      if (id) {
        drag.current = { kind: 'string', mode: stringStroke(id, design.electrical?.maxLen) };
        ref.current.setPointerCapture(e.pointerId);
        return;
      }
    }
    if (tool === 'add-panel' || tool === 'remove-panel') {
      // one panel at a time: the slot under the tap on whichever base is there
      const t = design.tables.find((k) => k.kind !== 'zone' && pointInPolygon(w, k.poly));
      if (t) togglePanelAt(design, t, w, tool === 'add-panel' ? 'add' : 'remove');
      return;
    }
    if (tool === 'add-base') {
      // base first: press and drag out the base (any number of rows × columns, snapped to whole
      // panels); a plain tap drops a small one. Panels are planted on it afterwards.
      drag.current = { kind: 'base', start: w, sx: e.clientX, sy: e.clientY };
      ref.current.setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'add-array' || tool === 'add-elevated') {
      const elevated = tool === 'add-elevated';
      if (s.config.pricingMode === 'package') s.patch('config', { pricingMode: 'custom' });
      return s.addObject({ id: newId('a'), type: 'array', elevated, x: w.x, y: w.y, rows: elevated ? 3 : 2, cols: 4, tilt: elevated ? 10 : config.tilt, azimuth: design.defaultAzimuth, frontLeg: elevated ? 2.4 : config.frontLeg, orientation: config.orientation });
    }
    // pan
    drag.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, view };
    s.set({ selectedId: null });
    ref.current.setPointerCapture(e.pointerId);
  };

  const startDrag = (e, d) => {
    if (drawing || tool.startsWith('add') || tool === 'mark-area' || tool === 'string') return;
    e.stopPropagation();
    if (e.button !== 0) return;
    st().set({ selectedId: d.id });
    drag.current = { ...d, start: evW(e) };
    ref.current.setPointerCapture(e.pointerId);
  };

  const onMove = (e) => {
    const w = evW(e);
    if (drawing) setCursor(w);
    const d = drag.current;
    if (!d) return;
    const s = st();
    if (d.kind === 'area') return setArea({ ...areaRect(d.start, w), start: d.start, end: w });
    if (d.kind === 'base') {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
      const sec = topSection(design.sections, d.start.x, d.start.y);
      const plane = sec && planeAt(sec, d.start.x, d.start.y);
      const shape = { orientation: s.config.orientation, tilt: plane ? plane.tilt : s.config.tilt, azimuth: plane ? plane.azimuth : design.azimuthFor ? design.azimuthFor(sec || design.sections[0]) : design.defaultAzimuth };
      const slots = slotsBetween(d.start, w, shape, design.spec);
      return setBaseDraft({ ...slots, azimuth: shape.azimuth, poly: rectPoly(slots.center.x, slots.center.y, slots.width, slots.depth, shape.azimuth) });
    }
    if (d.kind === 'string') {
      const id = moduleAt(w);
      if (id) stringPaint(id, d.mode, design.electrical?.maxLen);
      return;
    }
    if (d.kind === 'pan') {
      if (d.click && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
      d.click = null;
      setView({ ...d.view, cx: d.view.cx - (e.clientX - d.sx) / view.scale, cy: d.view.cy + (e.clientY - d.sy) / view.scale });
    } else if (d.kind === 'move') {
      const dx = w.x - d.start.x;
      const dy = w.y - d.start.y;
      if (d.points) {
        const points = d.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        if (d.isSection) s.updateSection(d.id, { points });
        else {
          const c = polygonCentroid(points);
          s.updateObject(d.id, { points, x: c.x, y: c.y });
        }
        if (dragGuides) setDragGuides(null);
      } else {
        const o = s.objects.find((k) => k.id === d.id);
        const pos = { x: d.x + dx, y: d.y + dy };
        const next = o?.type === 'array' && !e.altKey ? magnetize(o, pos, design) : pos;
        s.updateObject(d.id, next);
        if (o?.type === 'array') setDragGuides(computeDragGuides(o, next, design));
        else if (dragGuides) setDragGuides(null);
      }
    } else if (d.kind === 'ridge') {
      const raw = st().sections.find((x) => x.id === d.sectionId);
      const fr = raw && normSection(raw).frame;
      if (!fr) return;
      const along = w.x * fr.f.x + w.y * fr.f.y;
      // snaps to the centre when close, so a symmetric roof is easy to get back to
      let ridge = Math.min(0.85, Math.max(0.15, (fr.dMax - along) / (fr.dMax - fr.dMin)));
      if (Math.abs(ridge - 0.5) < 0.03) ridge = 0.5;
      ridge = Math.round(ridge * 100) / 100;
      // moving the ridge changes how wide each slope is, not how high the roof is: keep the rise
      const pitch = Math.min(60, Math.max(1, Math.round((Math.atan(fr.rise / (ridge * (fr.dMax - fr.dMin))) * 180000) / Math.PI) / 1000));
      st().updateSection(d.sectionId, { ridge, pitch });
    } else if (d.kind === 'vertex') {
      const points = d.points.map((p, i) => (i === d.index ? w : p));
      if (d.isSection) s.updateSection(d.id, { points });
      else {
        const c = polygonCentroid(points);
        s.updateObject(d.id, { points, x: c.x, y: c.y });
      }
    } else if (d.kind === 'resize-table') {
      const o = s.objects.find((k) => k.id === d.id);
      if (!o) return;
      // whole panel slots, any number of them; a base keeps the panels planted on it
      s.updateObject(o.id, withinPackage(o, resizeBase(o, d.anchor, w, design.spec), design.spec)); // a package caps the panels
    } else if (d.kind === 'resize-block') {
      const o = s.objects.find((k) => k.id === d.id);
      if (!o) return;
      const a = ((o.rot || 0) * Math.PI) / 180;
      const lu = (w.x - o.x) * Math.cos(a) - (w.y - o.y) * Math.sin(a);
      const lv = (w.x - o.x) * Math.sin(a) + (w.y - o.y) * Math.cos(a);
      s.updateObject(o.id, { w: Math.max(0.4, Math.round(Math.abs(lu) * 20) / 10), d: Math.max(0.4, Math.round(Math.abs(lv) * 20) / 10) });
    } else if (d.kind === 'radius') s.updateObject(d.id, { r: Math.max(0.5, dist(w, d.center)) });
    else if (d.kind === 'tank-diameter') {
      const diameter = Math.max(0.4, dist(w, d.center) * 2);
      s.updateObject(d.id, { w: diameter, d: diameter });
    }
    else if (d.kind === 'rotate') {
      let az = (Math.atan2(w.x - d.center.x, w.y - d.center.y) / DEG + 360) % 360;
      if (e.shiftKey) az = Math.round(az / 15) * 15;
      s.updateObject(d.id, d.isBlock ? { rot: az } : { azimuth: Math.round(az) });
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (dragGuides) setDragGuides(null);
    if (d?.kind === 'base') {
      const draft = baseDraft;
      setBaseDraft(null);
      if (draft) addBase(design, draft.center, { rows: draft.rows, cols: draft.cols });
      else addBase(design, d.start);
      return;
    }
    if (d?.kind === 'area') {
      const s = st();
      const kind = s.pendingKey;
      const preset = s.pendingBlock || {};
      const r = area && (area.w > 0.5 || area.d > 0.5) ? area : null;
      setArea(null);
      if (kind === 'tank') {
        const reach = r ? Math.hypot(r.end.x - d.start.x, r.end.y - d.start.y) : 0.75;
        s.addObject({ id: newId('b'), type: 'block', name: 'Water tank', shape: 'cylinder', x: d.start.x, y: d.start.y, w: Math.max(0.4, reach * 2), d: Math.max(0.4, reach * 2), h: s.pendingBlock?.h || 1.5, rot: 0 });
      } else if (kind === 'tree') {
        const rad = r ? Math.max(1, Math.hypot(r.end.x - r.start.x, r.end.y - r.start.y) / 2) : 2.5;
        const c = r ? { x: (r.start.x + r.end.x) / 2, y: (r.start.y + r.end.y) / 2 } : d.start;
        s.addObject({ id: newId('t'), type: 'tree', x: c.x, y: c.y, r: rad, h: Math.max(5, rad * 3) });
      } else if (kind === 'floor' || kind === 'stair' || kind === 'lift') {
        const q = r || areaRect({ x: d.start.x - 2, y: d.start.y - 2 }, { x: d.start.x + 2, y: d.start.y + 2 });
        addFlatDeck(s, kind, rectPoly(q.center.x, q.center.y, Math.max(q.w, 1), Math.max(q.d, 1), q.az));
      } else {
        const c = r ? r.center : d.start;
        s.addObject({ id: newId('b'), type: 'block', name: 'Object', h: 1.8, ...preset, x: c.x, y: c.y, w: r ? Math.max(r.w, 0.4) : preset.w || 1.5, d: r ? Math.max(r.d, 0.4) : preset.d || 1.5, rot: design.defaultAzimuth });
      }
      s.set({ pendingKey: null, pendingBlock: null });
      return;
    }
    if (d?.click && drawing) {
      const sn = snapPoint(d.click, draft, view.scale);
      if (sn.close) finishDraft(draft);
      else setDraft([...draft, sn.p]);
    }
  };

  const vertexHandles = (id, points, isSection) =>
    points.map((p, i) => {
      const q = toS(p);
      return (
        <circle
          key={i}
          cx={q.x}
          cy={q.y}
          r={7}
          fill="#fff"
          stroke={isSection ? BLUE : '#1d4ed8'}
          strokeWidth={3}
          style={{ cursor: 'move' }}
          onPointerDown={(e) => startDrag(e, { kind: 'vertex', id, index: i, points, isSection })}
          onContextMenu={(e) => {
            e.preventDefault();
            if (points.length > 3) (isSection ? st().updateSection : st().updateObject)(id, { points: points.filter((_, j) => j !== i) });
          }}
        />
      );
    });

  const cursorStyle = drawing || tool.startsWith('add') || tool === 'mark-area' || tool === 'string' || tool === 'remove-panel' ? 'crosshair' : 'grab';

  return (
    <div ref={ref} className="absolute inset-0 touch-none select-none overflow-hidden bg-[#0b1020]" style={{ cursor: cursorStyle }} onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
      <svg width={size.w} height={size.h} className="block">
        <defs>
          <pattern id="path-net" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="transparent" />
            <rect width="2.5" height="8" fill={PATH_COLORS.row} />
            <rect width="8" height="2.5" fill={PATH_COLORS.row} />
          </pattern>
        </defs>
        {images.map((im) => {
          const tl = toS({ x: -im.size / 2, y: im.size / 2 });
          return <image key={im.zoom} href={im.url} x={tl.x} y={tl.y} width={im.size * view.scale} height={im.size * view.scale} preserveAspectRatio="none" />;
        })}

        {/* roof sections */}
        {sections.map((s) => {
          const raised = editRaised && !isMainSection(sections, buildings, s);
          const shape = editSections || raised;
          const sel = s.id === selectedId && shape;
          return (
            <g key={s.id}>
              <polygon
                points={pts(s.points)}
                fill={shape ? 'rgba(180,195,255,0.35)' : 'rgba(180,195,255,0.12)'}
                stroke={BLUE}
                strokeWidth={shape ? 3 : 2}
                strokeLinejoin="round"
                onPointerDown={shape ? (e) => startDrag(e, { kind: 'move', id: s.id, points: s.points, isSection: true }) : undefined}
              />
              <SlopeMarks
                section={s}
                toS={toS}
                edit={slopeEdit && s.id === mainSection(sections, buildings, currentBuilding)?.id && tool === 'select' && !drawing}
                onLowEdge={(slopeAz) => {
                  const poly = normSection({ ...s, roofType: 'flat' }).poly;
                  st().updateSection(s.id, { slopeAz: snapSlopeAz(poly, slopeAz), slopeAzSnap: true });
                }}
                onRidgeDown={(e) => startDrag(e, { kind: 'ridge', sectionId: s.id })}
              />
              {shape && s.points.map((p, i) => <EdgeLabel key={i} a={p} b={s.points[(i + 1) % s.points.length]} toS={toS} />)}
              {sel && vertexHandles(s.id, s.points, true)}
              {shape && !sel && s.points.map((p, i) => <circle key={i} cx={toS(p).x} cy={toS(p).y} r={5} fill="#fff" stroke={BLUE} strokeWidth={2} pointerEvents="none" />)}
            </g>
          );
        })}

        {/* zones */}
        {showPanels &&
          objects
            .filter((o) => o.type === 'zone')
            .map((z) => {
              const sel = z.id === selectedId;
              return (
                <g key={z.id}>
                  <polygon points={pts(z.points)} fill={sel ? 'rgba(59,91,234,0.22)' : 'rgba(59,91,234,0.08)'} stroke="#3b5bea" strokeWidth={sel ? 2 : 1} strokeDasharray={sel ? '' : '6 4'} onPointerDown={(e) => startDrag(e, { kind: 'move', id: z.id, points: z.points })} />
                  {sel && vertexHandles(z.id, z.points, false)}
                </g>
              );
            })}

        {/* obstructions */}
        {showObjects &&
          objects
            .filter((o) => o.type === 'block')
            .map((b) => {
              const sel = b.id === selectedId;
              const cylinder = isCylinder(b);
              const poly = blockOutline(b);
              const c = toS(cylinder ? b : polygonCentroid(poly));
              const drawn = !cylinder && b.points?.length >= 3;
              return (
                <g key={b.id}>
                  {cylinder ? (
                    <circle cx={c.x} cy={c.y} r={((b.w || 1.5) / 2) * view.scale} fill="rgba(31,41,55,0.45)" stroke="#1f2937" strokeWidth={sel ? 3 : 1.5} onPointerDown={(e) => startDrag(e, { kind: 'move', id: b.id, x: b.x, y: b.y })} />
                  ) : (
                    <polygon points={pts(poly)} fill="rgba(239,68,68,0.35)" stroke="#ef4444" strokeWidth={sel ? 3 : 1.5} onPointerDown={(e) => startDrag(e, drawn ? { kind: 'move', id: b.id, points: b.points } : { kind: 'move', id: b.id, x: b.x, y: b.y })} />
                  )}
                  <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#111', strokeWidth: 3 }}>
                    {b.name}
                  </text>
                  {sel && cylinder && <circle cx={c.x + ((b.w || 1.5) / 2) * view.scale} cy={c.y} r={7} fill="#fff" stroke="#1f2937" strokeWidth={3} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tank-diameter', id: b.id, center: { x: b.x, y: b.y } })} />}
                  {sel && drawn && vertexHandles(b.id, b.points, false)}
                  {sel && !drawn && !cylinder && <circle cx={toS(poly[2]).x} cy={toS(poly[2]).y} r={8} fill="#fff" stroke="#ef4444" strokeWidth={3} style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'resize-block', id: b.id })} />}
                </g>
              );
            })}
        {showObjects &&
          objects
            .filter((o) => o.type === 'tree')
            .map((t) => {
              const c = toS(t);
              const sel = t.id === selectedId;
              return (
                <g key={t.id}>
                  <circle cx={c.x} cy={c.y} r={t.r * view.scale} fill="rgba(74,180,90,0.55)" stroke="#2f9e44" strokeWidth={sel ? 3 : 1.5} strokeDasharray="7 4" onPointerDown={(e) => startDrag(e, { kind: 'move', id: t.id, x: t.x, y: t.y })} />
                  {sel && <circle cx={c.x + t.r * view.scale} cy={c.y} r={6} fill="#fff" stroke="#2f9e44" strokeWidth={3} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'radius', id: t.id, center: { x: t.x, y: t.y } })} />}
                </g>
              );
            })}

        {/* panel tables */}
        {showPanels &&
          design.tables.map((t) => {
            const manual = t.kind !== 'zone';
            const sel = t.source === selectedId && manual;
            const elevated = t.kind === 'elevated';
            const front = [t.poly[2], t.poly[3]];
            const mid = toS({ x: (front[0].x + front[1].x) / 2, y: (front[0].y + front[1].y) / 2 });
            const handle = toS({ x: t.x + Math.sin(t.azimuth * DEG) * (t.size.depth / 2 + 1.2), y: t.y + Math.cos(t.azimuth * DEG) * (t.size.depth / 2 + 1.2) });
            const empty = manual && t.modules.length === 0;
            const centre = toS({ x: t.x, y: t.y });
            return (
              <g key={t.id} onPointerDown={manual ? (e) => startDrag(e, { kind: 'move', id: t.source, x: t.x, y: t.y }) : (e) => startDrag(e, { kind: 'none', id: t.source })} style={{ cursor: manual ? 'move' : 'pointer' }}>
                {elevated && <polygon points={pts(rectPoly(t.x, t.y, t.size.width + 0.5, t.size.depth + 0.5, t.azimuth))} fill="rgba(245,165,36,0.45)" stroke={ORANGE} strokeWidth={2} />}
                {/* the base (mounting frame) the panels sit on; shown on its own until panels are planted */}
                {manual && <polygon points={pts(t.poly)} fill={!t.valid ? 'rgba(239,68,68,0.35)' : empty ? 'rgba(148,163,184,0.55)' : 'rgba(71,85,105,0.75)'} stroke={empty ? '#f8fafc' : '#1e293b'} strokeWidth={empty ? 2 : 1.2} strokeDasharray={empty ? '6 4' : ''} />}
                {empty && t.size.width * view.scale > 48 && (
                  <text x={centre.x} y={centre.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a" pointerEvents="none">Empty base</text>
                )}
                {!structuresOnly && t.modules.map((m) => {
                  const si = stringColors?.get(m.id);
                  return <polygon key={m.id} points={pts(m.corners)} fill={!t.valid ? 'rgba(239,68,68,0.7)' : si != null ? si : 'rgba(40,98,235,0.85)'} stroke={elevated || sel ? ORANGE : '#dbe6ff'} strokeWidth={0.8} />;
                })}
                {/* pathways left between rows / columns: walkway strips; a selected base also shows the
                    width of the first one in each direction as a dimension mark */}
                {(t.pathways || []).map((p, pi) => (
                  <polygon key={`${p.axis}-${pi}`} points={pts(p.poly)} fill="url(#path-net)" stroke={PATH_COLORS[p.axis]} strokeWidth={1} pointerEvents="none" />
                ))}
                {sel && ['row', 'col'].map((axis) => t.pathways?.find((p) => p.axis === axis)).filter(Boolean).map((p) => {
                  const a = toS(p.dim[0]);
                  const b = toS(p.dim[1]);
                  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
                  const n = { x: -(b.y - a.y) / len * 5, y: (b.x - a.x) / len * 5 }; // tick half-length, square to the line
                  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                  const label = `${Math.round(p.width * 100)} cm`;
                  return (
                    <g key={`dim-${p.axis}`} pointerEvents="none">
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={1.5} />
                      {[a, b].map((q, i) => <line key={i} x1={q.x - n.x} y1={q.y - n.y} x2={q.x + n.x} y2={q.y + n.y} stroke="#fff" strokeWidth={1.5} />)}
                      <rect x={m.x - label.length * 2.9} y={m.y - 7} width={label.length * 5.8} height={14} rx={3} fill={PATH_COLORS[p.axis]} />
                      <text x={m.x} y={m.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">{label}</text>
                    </g>
                  );
                })}
                {sel && (
                  <>
                    <polygon points={pts(t.poly)} fill="none" stroke={ORANGE} strokeWidth={2.5} />
                    <line x1={mid.x} y1={mid.y} x2={handle.x} y2={handle.y} stroke={ORANGE} strokeWidth={2} />
                    <g style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'resize-table', id: t.source, anchor: t.poly[3] })}>
                      <circle cx={toS(t.poly[1]).x} cy={toS(t.poly[1]).y} r={11} fill="#fff" stroke={ORANGE} strokeWidth={3} />
                      <text x={toS(t.poly[1]).x} y={toS(t.poly[1]).y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={ORANGE} pointerEvents="none">⤡</text>
                    </g>
                    <circle cx={handle.x} cy={handle.y} r={7} fill={ORANGE} stroke="#fff" strokeWidth={2} style={{ cursor: 'grab' }} onPointerDown={(e) => startDrag(e, { kind: 'rotate', id: t.source, center: { x: t.x, y: t.y } })} />
                  </>
                )}
              </g>
            );
          })}

        {baseDraft && (
          <g pointerEvents="none">
            <polygon points={pts(baseDraft.poly)} fill="rgba(148,163,184,0.5)" stroke="#f8fafc" strokeWidth={2} strokeDasharray="6 4" />
            <text x={toS(baseDraft.center).x} y={toS(baseDraft.center).y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">{baseDraft.rows} × {baseDraft.cols} panels</text>
          </g>
        )}
        {dragGuides && (
          <g pointerEvents="none">
            {(dragGuides.aligns || []).map((g, i) => {
              const a = toS(g.a);
              const b = toS(g.b);
              return <line key={`a${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#f472b6" strokeWidth={1.5} strokeDasharray="6 5" />;
            })}
            {(dragGuides.gaps || []).map((g, i) => {
              const a = toS(g.a);
              const b = toS(g.b);
              const m = toS(g.mid);
              const label = `${(g.dist * 3.281).toFixed(1)} ft`;
              return (
                <g key={`g${i}`}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#38bdf8" strokeWidth={1.5} />
                  <rect x={m.x - label.length * 2.8} y={m.y - 8} width={label.length * 5.6} height={15} rx={3} fill="#0ea5e9" />
                  <text x={m.x} y={m.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{label}</text>
                </g>
              );
            })}
          </g>
        )}
        {/* the string being built: its panels numbered in the order they were tapped, joined in that order */}
        {stringPath && stringPath.points.length > 0 && (
          <g pointerEvents="none">
            {stringPath.points.length > 1 && <polyline points={stringPath.points.map((m) => { const q = toS(m); return `${q.x},${q.y}`; }).join(' ')} fill="none" stroke="#ffffff" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />}
            {stringPath.points.length > 1 && <polyline points={stringPath.points.map((m) => { const q = toS(m); return `${q.x},${q.y}`; }).join(' ')} fill="none" stroke={stringPath.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
            {stringPath.points.map((m, i) => {
              const q = toS(m);
              return (
                <g key={m.id}>
                  <circle cx={q.x} cy={q.y} r={9} fill={stringPath.color} stroke="#ffffff" strokeWidth={2} />
                  <text x={q.x} y={q.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">{i + 1}</text>
                </g>
              );
            })}
          </g>
        )}
        {area && (
          <g pointerEvents="none">
            {st().pendingKey === 'tree' ? (
              <circle cx={toS({ x: (area.start.x + area.end.x) / 2, y: (area.start.y + area.end.y) / 2 }).x} cy={toS({ x: (area.start.x + area.end.x) / 2, y: (area.start.y + area.end.y) / 2 }).y} r={(Math.hypot(area.end.x - area.start.x, area.end.y - area.start.y) / 2) * view.scale} fill="rgba(74,180,90,0.4)" stroke="#2f9e44" strokeWidth={2} strokeDasharray="7 4" />
            ) : (
              <>
                <polygon points={pts(area.poly)} fill="rgba(37,99,235,0.3)" stroke="#1d4ed8" strokeWidth={2.5} strokeDasharray="7 4" />
                <EdgeLabel a={area.poly[0]} b={area.poly[1]} toS={toS} />
                <EdgeLabel a={area.poly[1]} b={area.poly[2]} toS={toS} />
              </>
            )}
          </g>
        )}
        {/* drawing in progress */}
        {drawing && draft.length > 0 && (
          <g pointerEvents="none">
            {snap?.guides.map((g, i) => {
              const a = toS({ x: g.a.x - Math.cos(g.dir) * 500, y: g.a.y - Math.sin(g.dir) * 500 });
              const b = toS({ x: g.a.x + Math.cos(g.dir) * 500, y: g.a.y + Math.sin(g.dir) * 500 });
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="7 6" />;
            })}
            <polyline points={pts(snap ? [...draft, snap.p] : draft)} fill="none" stroke={tool === 'draw-zone' ? '#3b5bea' : BLUE} strokeWidth={3} strokeDasharray="7 5" />
            {draft.map((p, i) => i < draft.length - 1 && <EdgeLabel key={i} a={p} b={draft[i + 1]} toS={toS} />)}
            {snap && <EdgeLabel a={draft[draft.length - 1]} b={snap.p} toS={toS} />}
            {draft.map((p, i) => (
              <circle key={i} cx={toS(p).x} cy={toS(p).y} r={i === 0 && snap?.close ? 10 : 7} fill="#fff" stroke={BLUE} strokeWidth={3} />
            ))}
            {snap && <circle cx={toS(snap.p).x} cy={toS(snap.p).y} r={7} fill={ORANGE} />}
          </g>
        )}
        {/* every building's main roof: its name (on a campus) and area */}
        {!drawing && sections.filter((s) => isMainSection(sections, buildings, s)).map((s) => {
          const c = toS(polygonCentroid(s.points));
          const campus = buildingList(buildings).length > 1;
          if (!campus && !editSections) return null;
          return (
            <text key={s.id} x={c.x} y={c.y} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: '#1e293b', strokeWidth: 3 }}>
              {campus && <tspan x={c.x} dy={editSections ? '-0.3em' : '0.35em'}>{buildingList(buildings).find((b) => b.id === buildingIdOf(s, buildings))?.name}</tspan>}
              {editSections && <tspan x={c.x} dy={campus ? '1.25em' : '0.35em'} fontWeight={campus ? 500 : 700}>{polygonArea(s.points).toFixed(1)} m²</tspan>}
            </text>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute bottom-2 right-3 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80">Imagery © Google</div>
      {children}
    </div>
  );
}
