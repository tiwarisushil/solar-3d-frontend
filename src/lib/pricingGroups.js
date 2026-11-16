// Combined product pricing: group catalog lines under named sell prices for the proposal BOM.
import { newId } from './model.js';

/** Stable keys for lines that can sit in a pricing group. */
export function pricedMemberCatalog(design) {
  const { cost, totals, spec, structure } = design;
  if (cost?.isPackage) return [];
  const rows = [];
  if (totals?.count > 0) {
    rows.push({
      key: 'modules',
      shortLabel: 'Solar modules',
      label: `Solar modules (${totals.count} × ${spec?.watts || '?'} W)`,
      amount: Number(cost.panels) || 0,
    });
  }
  if ((Number(cost.pillars) || 0) > 0 || (structure?.columns || 0) > 0) {
    rows.push({
      key: 'structure',
      shortLabel: 'Mounting structure',
      label: `Mounting structure${structure?.columns ? ` · ${structure.columns} poles` : ''}`,
      amount: Number(cost.pillars) || 0,
    });
  }
  for (const m of cost.categoryMaterials || []) {
    rows.push({
      key: `material:${m.categoryId}`,
      shortLabel: m.categoryName || m.productName || 'Material',
      label: `${m.categoryName}: ${m.productName}`,
      amount: Number(m.baseTotal ?? m.total) || 0,
    });
  }
  (cost.extraItems || []).forEach((x, i) => {
    if (!x?.name) return;
    const qty = Number(x.qty) || 1;
    rows.push({
      key: `extra:${i}`,
      shortLabel: x.name,
      label: x.name,
      amount: qty * (Number(x.price) || 0),
    });
  });
  return rows;
}

/** Group title = product names joined with " + " (e.g. "Solar modules + Inverter"). */
export function groupNameFromMembers(memberKeys, members) {
  const byKey = new Map((members || []).map((m) => [m.key, m]));
  const labels = (memberKeys || [])
    .map((k) => byKey.get(k)?.shortLabel || byKey.get(k)?.label)
    .filter(Boolean);
  if (!labels.length) return 'Product group';
  return labels.join(' + ');
}

/** Resolve a group's display name from its members on the current design. */
export function resolveGroupName(group, design) {
  return groupNameFromMembers(group?.memberKeys, pricedMemberCatalog(design));
}

export const isCombinedPricing = (config) => (config?.productPricingMode || 'separate') === 'combined';

export function normalizePricingGroups(groups) {
  return (Array.isArray(groups) ? groups : [])
    .map((g) => ({
      id: g.id || newId('pg'),
      name: String(g.name || '').trim() || 'Group',
      price: Math.max(0, Number(g.price) || 0),
      gstPercent: g.gstPercent != null && g.gstPercent !== '' ? Number(g.gstPercent) : undefined,
      memberKeys: Array.isArray(g.memberKeys) ? [...new Set(g.memberKeys.map(String))] : [],
    }))
    .filter((g) => g.memberKeys.length > 0 || g.price > 0 || g.name !== 'Group');
}

/** Keys already claimed by a group (optionally excluding one group while editing). */
export function claimedMemberKeys(groups, exceptId = null) {
  const set = new Set();
  for (const g of normalizePricingGroups(groups)) {
    if (exceptId && g.id === exceptId) continue;
    for (const k of g.memberKeys) set.add(k);
  }
  return set;
}

/** Empty group ready for the Products UI. */
export function emptyPricingGroup() {
  return { id: newId('pg'), name: '', price: 0, memberKeys: [] };
}
