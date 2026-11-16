'use client';

// Dock rows / cols / rotate / nudge: preview one base without a full scene rebuild on every click.
// Preview state lives here (Zustand) so only the ghost + PanelTables skip subscribe — not Scene3D.

import { startTransition } from 'react';
import { create } from 'zustand';
import { previewArray } from './model.js';
import { useStore } from './store.js';

export const LAYOUT_COMMIT_MS = 220;

/** Uncommitted dock / add-panel patch for one array. `table` is the expanded preview for the 3D ghost. */
export const useLayoutDraft = create(() => ({ id: null, patch: null, table: null, isNew: false }));

let timer = 0;
let previewMounted = 0; // Scene3D LayoutGhost mounted → use live draft instead of blocking rebuild
let pendingNew = null;

/** Call from LayoutGhost mount so add/remove can preview in 3D only. */
export function retainLayoutPreview() {
  previewMounted += 1;
  return () => {
    previewMounted = Math.max(0, previewMounted - 1);
  };
}

export function hasLayoutPreview() {
  return previewMounted > 0;
}

export function peekLayoutDraft() {
  return useLayoutDraft.getState();
}

/** Effective store object with any live draft merged (for slot picking / caps). */
export function objectWithDraft(o) {
  if (!o) return o;
  const d = useLayoutDraft.getState();
  if (d.id === o.id && d.patch && !d.isNew) return { ...o, ...d.patch };
  return o;
}

/** Merge a patch onto a base, show the ghost, debounce the store write. */
export function applyLayoutPatch(id, patch, design) {
  const cur = useLayoutDraft.getState();
  if (cur.id && (cur.isNew || cur.id !== id)) commitLayoutDraft();
  const o0 = useStore.getState().objects.find((x) => x.id === id && x.type === 'array');
  if (!o0) return false;
  const next = useLayoutDraft.getState();
  const prev = next.id === id && !next.isNew ? next.patch || {} : {};
  const merged = { ...prev, ...patch };
  const table = previewArray({ ...o0, ...merged }, design);
  useLayoutDraft.setState({ id, patch: merged, table, isNew: false });
  clearTimeout(timer);
  timer = setTimeout(() => commitLayoutDraft(), LAYOUT_COMMIT_MS);
  return true;
}

/** Preview a new empty base, then addObject after idle. */
export function scheduleAddBase(o, design) {
  if (useLayoutDraft.getState().id) commitLayoutDraft();
  pendingNew = o;
  const table = previewArray(o, design);
  useLayoutDraft.setState({ id: o.id, patch: { ...o }, table, isNew: true });
  clearTimeout(timer);
  timer = setTimeout(() => commitLayoutDraft(), LAYOUT_COMMIT_MS);
  return o;
}

export function commitLayoutDraft() {
  clearTimeout(timer);
  timer = 0;
  const { id, patch, isNew } = useLayoutDraft.getState();
  if (!id || !patch) return;
  if (isNew) {
    const obj = pendingNew;
    pendingNew = null;
    if (obj) startTransition(() => useStore.getState().addObject(obj));
    return;
  }
  startTransition(() => useStore.getState().updateObject(id, patch));
}

export function discardLayoutDraft() {
  clearTimeout(timer);
  timer = 0;
  pendingNew = null;
  useLayoutDraft.setState({ id: null, patch: null, table: null, isNew: false });
}

/** Commit if selection moved to another base. */
export function flushLayoutDraftOnSelect(selectedId) {
  const { id, patch, isNew } = useLayoutDraft.getState();
  if (id && id !== selectedId) {
    clearTimeout(timer);
    timer = 0;
    if (isNew) {
      const obj = pendingNew;
      pendingNew = null;
      if (obj) startTransition(() => useStore.getState().addObject(obj));
    } else if (patch) {
      startTransition(() => useStore.getState().updateObject(id, patch));
    }
    useLayoutDraft.setState({ id: null, patch: null, table: null, isNew: false });
  }
}

function sameDraftVal(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  return false;
}

/** Clear the ghost once the store matches the draft. */
export function syncLayoutDraftAfterDesign(tables) {
  const { id, patch, isNew } = useLayoutDraft.getState();
  if (!id || !patch) return;
  if (isNew) {
    if (tables?.some((t) => t.source === id)) {
      pendingNew = null;
      useLayoutDraft.setState({ id: null, patch: null, table: null, isNew: false });
    }
    return;
  }
  const o = useStore.getState().objects.find((x) => x.id === id);
  if (!o) return;
  if (Object.keys(patch).every((k) => sameDraftVal(o[k], patch[k]))) {
    useLayoutDraft.setState({ id: null, patch: null, table: null, isNew: false });
  }
}
