// Maps direct-sun lit fraction (0–100%) to the live 3D heatmap tint.
// Instance colors multiply the panel texture: white keeps the usual blue cells.

/** @typedef {{ min: number, label: string, tint: string, swatch: string }} EfficiencyBand */

/** Bands shown in the viewer legend (highest first). `tint` is the instanceColor multiplier. */
export const EFFICIENCY_BANDS = /** @type {EfficiencyBand[]} */ ([
  { min: 95, label: '95%+', tint: '#ffffff', swatch: '#1d3a80' },
  { min: 90, label: '90–95%', tint: '#4ade80', swatch: '#4ade80' },
  { min: 80, label: '80–90%', tint: '#facc15', swatch: '#facc15' },
  { min: 0, label: '<80%', tint: '#f87171', swatch: '#f87171' },
]);

/**
 * Instance tint for a panel's effective direct-sun exposure (% of area lit).
 * @param {number} pct  litFraction × 100
 * @returns {string} hex color
 */
export function efficiencyColor(pct) {
  const n = Number.isFinite(pct) ? pct : 0;
  for (const band of EFFICIENCY_BANDS) {
    if (n >= band.min) return band.tint;
  }
  return EFFICIENCY_BANDS[EFFICIENCY_BANDS.length - 1].tint;
}
