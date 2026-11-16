'use client';

import { DEG } from './geo.js';
import { polygonCentroid } from './geometry.js';
import { applyLayoutPatch, hasLayoutPreview, objectWithDraft, peekLayoutDraft, scheduleAddBase } from './layoutEdit.js';
import { baseFit, baseFor, buildDesign, FLUSH_STANDOFF, isBase, newId, planeAt, plantedKeys, plantedOn, slotAt, tableSize, topSection, zonesForSection } from './model.js';
import { useStore } from './store.js';
import { toast } from '../components/kit/index.js';

/* ───────────── package mode: the user places panels up to the package's number ───────────── */

/** With a package priced, the number of panels in it (the most the user may place); otherwise null. */
export function packageCap() {
  const s = useStore.getState();
  if (s.config.pricingMode !== 'package') return null;
  const pkg = (s.catalog?.packages || []).find((p) => p.id === s.config.packageId);
  const it = pkg?.items?.find((x) => x.itemType === 'panel' || /panel/i.test(x.name || ''));
  const n = Number(it?.qty) || 0;
  return n > 0 ? n : null;
}

/** Panels planted on the roof now. */
export const plantedTotal = (objects, spec) => objects.filter((o) => o.type === 'array').reduce((a, o) => a + plantedOn(o, spec).count, 0);

const capMessage = (cap) => `This package has ${cap} panels and all of them are placed. Take one off first, or switch to Custom on the Package step.`;

/**
 * A change to base `o` (resize, rows / columns, a copy) kept within the package: when it would put more panels
 * on the roof than the package has, the base takes only what is left. Without a package the patch is unchanged.
 */
export function withinPackage(o, patch, spec, { isNew = false } = {}) {
  const cap = packageCap();
  if (!cap) return patch;
  const objects = useStore.getState().objects;
  const others = plantedTotal(objects, spec) - (isNew ? 0 : plantedOn(o, spec).count);
  const next = { ...o, ...patch };
  const want = next.planted === false ? 0 : plantedOn(next, spec).count;
  if (others + want <= cap) return patch;
  const left = Math.max(0, cap - others);
  toast.error(left ? `This package has ${cap} panels: only ${left} more fit on this base.` : capMessage(cap));
  return left ? { ...patch, planted: true, filled: undefined, count: left } : { ...patch, planted: false, filled: undefined, count: undefined };
}

/**
 * The name shown for the `i`-th base: its own name when the user typed one, otherwise "Base N" by its
 * place in the list (layouts made automatically used to be called "Group N", numbered with gaps).
 */
export const baseLabel = (o, i) => (o?.name && !/^(Group|Base) \d+$/.test(o.name) ? o.name : `Base ${i + 1}`);

/** Every base (group with its own footprint), in the order it was added — the auto layout's too. */
export const userBases = (objects) => objects.filter(isBase);
/** The bases the user designed or changed themselves; while there are none, sizing re-lays the roof. */
export const designedBases = (objects) => objects.filter((o) => isBase(o) && !o.auto);

/**
 * A new, empty base at (x, y): the frame the panels are planted on later. Sized for `rows` × `cols`
 * panel slots. On a sloped roof the base lies on the slope (its tilt and facing are the roof's).
 */
export function addBase(design, { x, y }, { rows, cols } = {}) {
  const s = useStore.getState();
  const c = s.config;
  const sec = topSection(design.sections, x, y);
  const plane = sec && planeAt(sec, x, y);
  const draft = peekLayoutDraft();
  const n = userBases(s.objects).length + (draft.isNew ? 1 : 0);
  const shape = { orientation: c.orientation, tilt: plane ? plane.tilt : c.tilt, azimuth: plane ? plane.azimuth : design.azimuthFor ? design.azimuthFor(sec || design.sections[0]) : design.defaultAzimuth, frontLeg: plane ? FLUSH_STANDOFF : c.frontLeg };
  const slots = { rows: rows || (plane ? 1 : c.rowsPerTable || 2), cols: cols || 4 };
  const o = { id: newId('g'), type: 'array', name: `Base ${n + 1}`, x, y, ...shape, ...slots, ...baseFor(slots.rows, slots.cols, shape, design.spec), planted: false };
  // 3D: live ghost (same path as dock ±); plan view writes immediately
  if (hasLayoutPreview()) scheduleAddBase(o, design);
  else s.addObject(o);
  return o;
}

/** An empty base in the middle of the first roof (the sidebar's "add" with nothing to tap). */
export function addBaseOnRoof(design) {
  const sec = design.sections[0];
  const c = sec ? polygonCentroid(sec.poly) : { x: 0, y: 0 };
  return addBase(design, c);
}

/** Plant panels on bases: fill every base (or the given ones) to what fits on it. */
export function plantBases(design, ids = null) {
  return plantUpTo(Infinity, design.spec, ids);
}

/**
 * Plant up to `count` panels across the user's bases, in order, each base filled to what fits on it
 * before the next one gets any. Infinity fills them all. Returns how many panels were planted.
 */
export function plantUpTo(count, sp, ids = null, { keepPricing = false } = {}) {
  const s = useStore.getState();
  // planting by hand with a package: never more panels than the package has
  const cap = keepPricing ? null : packageCap();
  if (cap) {
    const onOthers = s.objects.filter((o) => o.type === 'array' && !(isBase(o) && (!ids || ids.includes(o.id)))).reduce((a, o) => a + plantedOn(o, sp).count, 0);
    const room = Math.max(0, cap - onOthers);
    count = Math.min(count, room);
    if (!room) {
      toast.error(capMessage(cap));
      return 0;
    }
  }
  let left = count;
  let planted = 0;
  const objects = s.objects.map((o) => {
    if (!isBase(o) || (ids && !ids.includes(o.id))) return o;
    const fit = baseFit(o, sp);
    if (left <= 0 || fit.rows === 0 || fit.cols === 0) return { ...o, planted: false };
    // exactly what is left, up to what fits: the last base may be part-filled
    const n = Math.min(left, fit.rows * fit.cols);
    left -= n;
    planted += n;
    return { ...o, planted: true, rows: fit.rows, cols: fit.cols, count: n, filled: undefined, auto: false };
  });
  s.set({ objects, selectedId: s.selectedId });
  return planted;
}

/**
 * The add / remove panel tools: put one panel on the slot under `point` of table `t`, or take the
 * one there off. `mode` is 'add' or 'remove'. Returns true when something changed.
 */
export function togglePanelAt(design, t, point, mode) {
  const s = useStore.getState();
  const o0 = s.objects.find((k) => k.id === t.source);
  if (!o0 || o0.type !== 'array' || t.kind === 'zone') return false;
  const o = objectWithDraft(o0);
  const slot = slotAt(t, point, design.spec);
  if (!slot) return false;
  const keys = new Set(o.planted === false ? [] : plantedKeys(o, design.spec));
  if (mode === 'add' ? keys.has(slot.key) : !keys.has(slot.key)) return false;
  if (mode === 'add') {
    const cap = packageCap();
    const draft = peekLayoutDraft();
    const draftExtra = draft.id === o.id && draft.patch && !draft.isNew
      ? plantedOn({ ...o0, ...draft.patch }, design.spec).count - plantedOn(o0, design.spec).count
      : 0;
    if (cap && plantedTotal(s.objects, design.spec) + draftExtra >= cap) {
      toast.error(capMessage(cap));
      return false;
    }
    keys.add(slot.key);
  } else keys.delete(slot.key);
  const grid = { rows: Math.max(o.rows || 0, 1), cols: Math.max(o.cols || 0, 1) };
  const patch = keys.size
    ? { planted: true, filled: [...keys], count: undefined, auto: false, ...grid }
    : { planted: false, filled: undefined, count: undefined, auto: false };
  // 3D: expand only this base as a ghost (instant); store rebuild waits for idle
  if (hasLayoutPreview() && applyLayoutPatch(o.id, patch, design)) return true;
  s.updateObject(o.id, patch);
  return true;
}

/** The panel groups as they stand, to compare one layout with another. */
const arraysKey = (objects) => JSON.stringify(objects.filter((o) => o.type === 'array'));

/**
 * Down to `n` panels without moving anything: the extra panels come off the bases placed last (the last slots of
 * each first). A base left without panels is removed. The layout before the first trim is kept with the design
 * (`config.packageRestore`), so picking a bigger package again can bring those panels back.
 */
export function trimPanelsTo(n, spec) {
  const s = useStore.getState();
  let excess = plantedTotal(s.objects, spec) - n;
  if (excess <= 0) return;
  // trimming an already-trimmed layout (10 → 5 → 3): keep the original as the one to restore
  const prev = s.config.packageRestore;
  const original = prev && prev.after === arraysKey(s.objects) ? prev.objects : s.objects.filter((o) => o.type === 'array');
  const objects = [...s.objects];
  for (let i = objects.length - 1; i >= 0 && excess > 0; i--) {
    const o = objects[i];
    if (o.type !== 'array' || o.planted === false) continue;
    const keys = plantedKeys(o, spec);
    if (!keys.length) continue;
    if (excess >= keys.length) {
      objects[i] = null; // every panel off: the base goes too (it would only add poles and structure)
      excess -= keys.length;
    } else {
      objects[i] = { ...o, planted: true, filled: keys.slice(0, keys.length - excess), count: undefined, auto: false };
      excess = 0;
    }
  }
  const kept = objects.filter(Boolean);
  s.set({ objects: kept, selectedId: kept.some((o) => o.id === s.selectedId) ? s.selectedId : null });
  s.patch('config', { packageRestore: { objects: original, after: arraysKey(kept) } });
}

/**
 * A bigger package after a smaller one: the panels the smaller one took off come back (then trimmed to `n` if the
 * original had more). Only when the user has not changed the panels since — their own edits always win.
 */
export function restorePanels(n, spec) {
  const s = useStore.getState();
  const r = s.config.packageRestore;
  if (!r || r.after !== arraysKey(s.objects)) return false;
  const objects = [...s.objects.filter((o) => o.type !== 'array'), ...r.objects];
  s.set({ objects, selectedId: null });
  if (plantedTotal(objects, spec) > n) trimPanelsTo(n, spec);
  else s.patch('config', { packageRestore: null }); // all of them are back
  return true;
}

/** Take the panels off bases again (the bases stay). */
export function clearBases(ids = null) {
  const s = useStore.getState();
  s.set({ objects: s.objects.map((o) => (isBase(o) && (!ids || ids.includes(o.id)) ? { ...o, planted: false, auto: false } : o)) });
}

/** Panels that fit on all the user's bases together. */
export function basesCapacity(objects, spec) {
  return userBases(objects).reduce((a, o) => { const f = baseFit(o, spec); return a + f.rows * f.cols; }, 0);
}

const FT = 3.281;

/** Edge-to-edge gaps along one axis, in metres (sorted left→right / front→back). */
function axisGaps(items, getPos, getHalf) {
  if (items.length < 2) return [];
  const sorted = [...items].sort((a, b) => getPos(a) - getPos(b));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(getPos(sorted[i]) - getHalf(sorted[i]) - (getPos(sorted[i - 1]) + getHalf(sorted[i - 1])));
  }
  return gaps;
}

const gapStats = (gaps) => {
  if (!gaps.length) return null;
  const min = Math.min(...gaps);
  const max = Math.max(...gaps);
  const avg = gaps.reduce((a, g) => a + g, 0) / gaps.length;
  return { min, max, avg, gaps };
};

/**
 * Place items along one axis. With `gap` (metres): fixed edge gap, group centroid kept.
 * Without: equal gaps, outermost edges stay put.
 */
function distributeAlong(items, getPos, getHalf, setPos, gap) {
  if (items.length < 2) return;
  const sorted = [...items].sort((a, b) => getPos(a) - getPos(b));
  if (gap == null || !Number.isFinite(gap)) {
    const left = getPos(sorted[0]) - getHalf(sorted[0]);
    const right = getPos(sorted.at(-1)) + getHalf(sorted.at(-1));
    const widths = sorted.reduce((a, it) => a + getHalf(it) * 2, 0);
    const g = (right - left - widths) / (sorted.length - 1);
    let edge = left;
    for (const it of sorted) {
      const half = getHalf(it);
      setPos(it, edge + half);
      edge += half * 2 + g;
    }
    return;
  }
  const widths = sorted.reduce((a, it) => a + getHalf(it) * 2, 0);
  const span = widths + gap * (sorted.length - 1);
  const center = sorted.reduce((a, it) => a + getPos(it), 0) / sorted.length;
  let edge = center - span / 2;
  for (const it of sorted) {
    const half = getHalf(it);
    setPos(it, edge + half);
    edge += half * 2 + gap;
  }
}

/** Bases of one building, projected onto across (u) / along (v) axes from their common facing. */
function buildingBaseItems(list, spec) {
  const azCounts = new Map();
  for (const { o, t } of list) {
    const az = Math.round(((t?.azimuth ?? o.azimuth) || 180) / 5) * 5;
    azCounts.set(az, (azCounts.get(az) || 0) + 1);
  }
  const az = [...azCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const f = { x: Math.sin(az * DEG), y: Math.cos(az * DEG) };
  const c = { x: f.y, y: -f.x };
  const items = list.map(({ o, t }) => {
    const size = t?.size || tableSize(o, spec);
    return {
      id: o.id,
      u: o.x * c.x + o.y * c.y,
      v: o.x * f.x + o.y * f.y,
      halfU: (size.width || o.w || 1) / 2,
      halfV: (size.depth || o.len || 1) / 2,
    };
  });
  return { az, f, c, items };
}

/** Cluster projected bases into rows along the facing axis. */
function clusterRows(items) {
  const avgDepth = items.reduce((a, it) => a + it.halfV * 2, 0) / items.length;
  const rowTol = Math.max(0.4, avgDepth * 0.7);
  const sortedV = [...items].sort((a, b) => a.v - b.v);
  const rows = [];
  for (const it of sortedV) {
    const row = rows.at(-1);
    if (!row || Math.abs(it.v - row.v) > rowTol) rows.push({ items: [it], v: it.v, halfV: it.halfV });
    else {
      row.items.push(it);
      row.v = row.items.reduce((a, x) => a + x.v, 0) / row.items.length;
      row.halfV = Math.max(row.halfV, it.halfV);
    }
  }
  return rows;
}

/** Bases grouped by building with across/along projections (shared by measure + space). */
function basesByBuilding(design, objects) {
  const byBuilding = new Map();
  for (const o of userBases(objects)) {
    const t = design.tables.find((x) => x.source === o.id);
    const key = t?.building || '_';
    if (!byBuilding.has(key)) byBuilding.set(key, []);
    byBuilding.get(key).push({ o, t });
  }
  return [...byBuilding.values()]
    .filter((list) => list.length >= 2)
    .map((list) => {
      const pack = buildingBaseItems(list, design.spec);
      return { ...pack, rows: clusterRows(pack.items) };
    });
}

const fmtFt = (m) => `${(Math.max(0, m) * FT).toFixed(1)} ft`;

/**
 * Live gap readout for the sidebar: across (left–right along a row) and along (between rows),
 * in feet. `hint` is a short label like "1.5–2.2 ft across · 3.0 ft along".
 */
export function measureBaseGaps(design) {
  const packs = basesByBuilding(design, useStore.getState().objects);
  if (!packs.length) return null;
  const across = [];
  const along = [];
  for (const { rows } of packs) {
    for (const row of rows) across.push(...axisGaps(row.items, (it) => it.u, (it) => it.halfU));
    if (rows.length >= 2) along.push(...axisGaps(rows, (r) => r.v, (r) => r.halfV));
  }
  const a = gapStats(across);
  const b = gapStats(along);
  const range = (s) => (!s ? null : Math.abs(s.max - s.min) < 0.03 ? fmtFt(s.avg) : `${fmtFt(s.min)}–${fmtFt(s.max)}`);
  const parts = [];
  if (a) parts.push(`${range(a)} side to side`);
  if (b) parts.push(`${range(b)} front to back`);
  return {
    across: a,
    along: b,
    acrossFt: a ? { min: a.min * FT, max: a.max * FT, avg: a.avg * FT } : null,
    alongFt: b ? { min: b.min * FT, max: b.max * FT, avg: b.avg * FT } : null,
    suggestedM: a?.avg ?? b?.avg ?? 0.6,
    hint: parts.length ? parts.join(' · ') : 'No gaps to measure',
  };
}

/**
 * Space / align panel bases.
 * - `gapM`: fixed edge gap in metres (omit to equalise and keep the outermost edges).
 * - `align`: `'row'` = one horizontal line, `'column'` = one vertical line; otherwise keep the grid
 *   and space within / between rows.
 */
export function spaceBases(design, { gapM, align } = {}) {
  const s = useStore.getState();
  if (s.readOnly) return 0;
  if (userBases(s.objects).length < 2) {
    toast.error('Add at least two bases to space them.');
    return 0;
  }
  const packs = basesByBuilding(design, s.objects);
  if (!packs.length) {
    toast.error('Need at least two bases on the same building to space them.');
    return 0;
  }
  const gap = gapM != null && Number.isFinite(gapM) ? Math.max(0, gapM) : undefined;
  const moved = new Map();

  for (const { f, c, items, rows: clustered } of packs) {
    if (align === 'row') {
      const v = items.reduce((a, it) => a + it.v, 0) / items.length;
      for (const it of items) it.v = v;
      distributeAlong(items, (it) => it.u, (it) => it.halfU, (it, u) => { it.u = u; }, gap);
    } else if (align === 'column') {
      const u = items.reduce((a, it) => a + it.u, 0) / items.length;
      for (const it of items) it.u = u;
      distributeAlong(items, (it) => it.v, (it) => it.halfV, (it, v) => { it.v = v; }, gap);
    } else {
      const rows = clustered;
      for (const row of rows) {
        distributeAlong(row.items, (it) => it.u, (it) => it.halfU, (it, u) => { it.u = u; }, gap);
      }
      if (rows.length >= 2) {
        distributeAlong(rows, (r) => r.v, (r) => r.halfV, (r, v) => {
          const d = v - r.v;
          r.v = v;
          for (const it of r.items) it.v += d;
        }, gap);
      }
    }
    for (const it of items) moved.set(it.id, { x: c.x * it.u + f.x * it.v, y: c.y * it.u + f.y * it.v });
  }

  s.set({
    objects: s.objects.map((o) => {
      const pos = moved.get(o.id);
      return pos ? { ...o, x: pos.x, y: pos.y, auto: false } : o;
    }),
  });
  return moved.size;
}

/** @deprecated use spaceBases — kept for older call sites */
export const equalSpaceBases = (design, opts) => spaceBases(design, opts);

/** Replace auto zones with one zone per roof section using the current defaults. */
export function autoFillRoof(design) {
  const s = useStore.getState();
  const c = s.config;
  const zones = design.sections.flatMap((sec) => zonesForSection(sec, c, design.azimuthFor(sec), design.lat, newId('z'))).map((z) => ({ ...z, auto: true }));
  s.set({ objects: [...s.objects.filter((o) => !(o.type === 'zone' && o.auto)), ...zones], selectedId: null });
}

/**
 * Auto-arrange panels as independent groups (one array object per table), optionally
 * limited to `count` panels. Groups can then be moved / tilted / resized individually.
 *
 * The roof gets EXACTLY `count` panels whenever it has room for them (a package's 5 panels are 5, never 4 or 6).
 * Groups are rows × cols rectangles, so the layout is made for whole rows (5 → a 2 × 3 base) and raised until it
 * covers `count`; the extra slots then stay empty on the base placed last (2 × 3 with 5 panels planted) instead
 * of becoming a lone panel somewhere else. Only a roof that is full gets fewer. (`atLeast` is kept for callers;
 * the count is always reached now.)
 */
export function autoGroups(design, count = 0, { atLeast = false, keepPricing = false, fresh = false } = {}) {
  const s = useStore.getState();
  const c = s.config;
  // the user designed bases: sizing plants panels on them instead of laying the roof out afresh.
  // `fresh` (a package that needs more panels than those bases hold) lays the roof out again.
  if (!fresh && designedBases(s.objects).length) {
    plantUpTo(count > 0 ? count : Infinity, design.spec, null, { keepPricing });
    s.patch('config', { maxPanels: 0, targetKw: 0 });
    return userBases(s.objects).length;
  }
  const keep = s.objects.filter((o) => o.type === 'tree' || o.type === 'block');
  // flat roofs: one zone with the design's tilt; sloped roofs: one zone per slope, panels flush
  const zones = design.sections.flatMap((sec) => zonesForSection(sec, c, design.azimuthFor(sec), design.lat, newId('z')));
  const layout = (limit) => {
    const temp = buildDesign({ sections: s.sections, buildings: s.buildings, objects: [...keep, ...zones], config: { ...c, maxPanels: limit }, lat: design.lat, spec: design.spec });
    // each auto group is a base the size of its panels, planted; `auto` until the user changes it
    return temp.tables.map((t, i) => ({ id: newId('g'), type: 'array', name: `Base ${i + 1}`, x: t.x, y: t.y, rows: t.rows, cols: t.cols, tilt: t.tilt, azimuth: t.azimuth, frontLeg: t.frontLeg, orientation: t.orientation, ...baseFor(t.rows, t.cols, t, design.spec), planted: true, auto: true }));
  };
  const placed = (groups) => groups.reduce((a, g) => a + g.rows * g.cols, 0);

  const perBase = Math.max(1, Math.round(Number(c.rowsPerTable)) || 1);
  const whole = count > 0 ? Math.ceil(count / perBase) * perBase : 0; // whole rows: no single panel left over
  let groups = layout(whole);
  if (count > 0) {
    // stops as soon as the target is covered, or when a higher limit adds nothing (the roof is full)
    for (let limit = whole + 1, last = placed(groups); last < count && limit <= whole + 8; limit++) {
      const next = layout(limit);
      if (placed(next) <= last && limit > whole + 4) break;
      if (placed(next) > last) {
        groups = next;
        last = placed(next);
      }
    }
    // exactly `count`: the slots beyond it stay empty, on the bases placed last (a base left with none goes)
    let excess = placed(groups) - count;
    for (let i = groups.length - 1; i >= 0 && excess > 0; i--) {
      const size = groups[i].rows * groups[i].cols;
      if (excess >= size) {
        groups.splice(i, 1);
        excess -= size;
      } else {
        groups[i] = { ...groups[i], count: size - excess };
        excess = 0;
      }
    }
  }
  s.set({ objects: [...keep, ...groups], selectedId: null, config: { ...c, maxPanels: 0, targetKw: 0 } });
  return groups.length;
}

/**
 * "Maximum panels": the most panels the roof physically takes. Tries 1–4 panel rows per base, upright
 * and sideways, with the bases packed (0.1 m apart, up to the parapet, as a drawn base may be) and a
 * fine search for where the rows start, then checks every layout as real bases. The winner has the
 * most valid panels (ties: more rows per base, so fewer poles). Plain data, no store writes.
 */
export function maxRoofLayout({ sections, buildings, objects, config, lat, spec, azimuthFor }) {
  const keep = objects.filter((o) => o.type === 'tree' || o.type === 'block');
  let best = null;
  for (const rowsPerTable of [1, 2, 3, 4]) {
    for (const orientation of ['portrait', 'landscape']) {
      const cfg = { ...config, rowsPerTable, orientation, setback: 0, rowGap: 0.1, maxPanels: 0 };
      const zones = sections.flatMap((sec) => zonesForSection(sec, cfg, azimuthFor(sec), lat, 'max')).map((z) => ({ ...z, phaseStep: 0.1 }));
      const laid = buildDesign({ sections, buildings, objects: [...keep, ...zones], config: cfg, lat, spec });
      const groups = laid.tables.map((t, i) => ({ id: newId('g'), type: 'array', name: `Base ${i + 1}`, x: t.x, y: t.y, rows: t.rows, cols: t.cols, tilt: t.tilt, azimuth: t.azimuth, frontLeg: t.frontLeg, orientation: t.orientation, ...baseFor(t.rows, t.cols, t, spec), planted: true, auto: true }));
      const check = buildDesign({ sections, buildings, objects: [...keep, ...groups], config: cfg, lat, spec });
      const ok = new Set(check.tables.filter((t) => t.valid).map((t) => t.source));
      const kept = groups.filter((g) => ok.has(g.id));
      const count = check.tables.filter((t) => t.valid).reduce((a, t) => a + t.modules.length, 0);
      if (!best || count > best.count || (count === best.count && rowsPerTable > best.rowsPerTable)) best = { count, groups: kept, rowsPerTable, orientation };
    }
  }
  return best || { count: 0, groups: [], rowsPerTable: config.rowsPerTable, orientation: config.orientation };
}

/**
 * Put the maximum layout on the roof (replaces every base; trees and obstacles stay). With `n`, only
 * that many panels: the rest come off the groups laid last (a whole group, or its last panels).
 */
export function applyMaxLayout(plan, n = 0) {
  const s = useStore.getState();
  const keep = s.objects.filter((o) => o.type === 'tree' || o.type === 'block');
  let excess = n > 0 ? Math.max(0, plan.count - n) : 0;
  const groups = [];
  for (let i = plan.groups.length - 1; i >= 0; i--) {
    const g = plan.groups[i];
    const size = g.rows * g.cols;
    if (excess >= size) {
      excess -= size;
      continue;
    }
    groups.unshift(excess > 0 ? { ...g, count: size - excess } : g);
    excess = 0;
  }
  s.set({ objects: [...keep, ...groups], selectedId: null, config: { ...s.config, rowsPerTable: plan.rowsPerTable, orientation: plan.orientation, maxPanels: 0, targetKw: 0 } });
}
