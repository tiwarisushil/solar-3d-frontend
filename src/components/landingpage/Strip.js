'use client';

import { FeatureArt } from './ui';

const STRIP = [['Leads', 'leads'], ['Lead board', 'lead-board'], ['Clients', 'clients'], ['3D designer', 'roof'], ['Proposals', 'proposals'], ['Estimation', 'quick'], ['Packages', 'packages'], ['Loans', 'loans'], ['Subsidies', 'subsidies'], ['Bills', 'bills'], ['Delivery challans', 'challans'], ['Receipts', 'receipts'], ['Expenses', 'expenses'], ['Inventory', 'inventory'], ['Installations', 'installations'], ['Tasks', 'tasks'], ['AMC tracker', 'amc'], ['Client support', 'support'], ['Client portal', 'portal'], ['Team roles', 'team'], ['Branches', 'branches']];

export default function Strip() {
  const row = (hidden) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 pr-3">
      {STRIP.map(([t, art]) => (
        <li key={t} className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pr-5 pl-1.5 text-[14.5px] font-medium whitespace-nowrap text-slate-700">
          <FeatureArt name={art} className="h-9 w-9 rounded-full" /> {t}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Everything inside" className="lp-marquee-wrap mt-16 overflow-hidden border-y border-slate-200 bg-slate-50 py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:mt-24">
      <div className="lp-marquee flex w-max">{row(false)}{row(true)}</div>
    </section>
  );
}
