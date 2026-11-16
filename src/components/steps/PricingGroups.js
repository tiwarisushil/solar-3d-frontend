'use client';

import { Plus, Trash2 } from 'lucide-react';
import { claimedMemberKeys, emptyPricingGroup, groupNameFromMembers, pricedMemberCatalog } from '@/lib/pricingGroups';
import { NumField } from '../kit';
import { cx } from '../ui';

/**
 * Combined pricing: one or more named groups of products with a single sell price each.
 * Separate mode leaves every product priced on its own (this editor is hidden).
 */
export default function PricingGroups({ design, groups, money, readOnly, onChange }) {
  const members = pricedMemberCatalog(design);
  const list = Array.isArray(groups) ? groups : [];

  const patchGroup = (id, patch) => onChange(list.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const removeGroup = (id) => onChange(list.filter((g) => g.id !== id));
  const addGroup = () => onChange([...list, emptyPricingGroup()]);

  const toggleMember = (group, key) => {
    const taken = claimedMemberKeys(list, group.id);
    if (!group.memberKeys.includes(key) && taken.has(key)) return;
    const memberKeys = group.memberKeys.includes(key)
      ? group.memberKeys.filter((k) => k !== key)
      : [...group.memberKeys, key];
    // name is always the joined product names
    patchGroup(group.id, { memberKeys, name: groupNameFromMembers(memberKeys, members) });
  };

  if (!members.length) {
    return <p className="text-sm text-slate-500">Pick products above first, then group them here.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Put products into one or more groups and set each group&apos;s sell price. Grouped products show as &ldquo;Included&rdquo; on the proposal; the group price is charged instead.
      </p>
      {list.map((g) => {
        const taken = claimedMemberKeys(list, g.id);
        const selected = members.filter((m) => g.memberKeys.includes(m.key));
        const catalogSum = selected.reduce((a, m) => a + m.amount, 0);
        const autoName = groupNameFromMembers(g.memberKeys, members);
        return (
          <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-slate-600">Group name</div>
                <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-slate-900">
                  {autoName}
                </div>
              </div>
              <label className="w-36 text-xs font-medium text-slate-600">
                Group price
                <NumField
                  min={0}
                  step="any"
                  disabled={readOnly}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold"
                  value={g.price ?? 0}
                  onValue={(v) => patchGroup(g.id, { price: v, name: autoName })}
                />
              </label>
              {!readOnly && (
                <button type="button" title="Remove group" onClick={() => removeGroup(g.id)} className="mt-5 grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {catalogSum > 0 && (
              <p className="mt-1 text-[12px] text-slate-500">Catalog total of selected items: {money(catalogSum)}</p>
            )}
            <div className="mt-3 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Products in this group</div>
              {members.map((m) => {
                const on = g.memberKeys.includes(m.key);
                const blocked = !on && taken.has(m.key);
                return (
                  <label
                    key={m.key}
                    className={cx(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm',
                      on ? 'border-brand bg-brand-soft/40' : blocked ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50' : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--brand,#2563eb)]"
                      disabled={readOnly || blocked}
                      checked={on}
                      onChange={() => toggleMember(g, m.key)}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{m.label}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">{money(m.amount)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
      {!readOnly && (
        <button type="button" onClick={addGroup} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Plus className="h-4 w-4" /> Add group
        </button>
      )}
      {!list.length && (
        <p className="text-sm text-amber-800">Add at least one group and pick products, or switch back to Separate pricing.</p>
      )}
    </div>
  );
}
