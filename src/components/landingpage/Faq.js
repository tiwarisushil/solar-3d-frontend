'use client';

import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cx } from '../kit';
import Reveal from '../marketing/Reveal';
import { Container, Eyebrow, Lede, SectionAnchor, Title } from './ui';

const FAQ = [
  ['How do I get a workspace?', 'Company workspaces are created by the platform administrator, who gives you a sign-in email and a temporary password. You can change the password after your first sign-in.'],
  ['Can my leads come in automatically?', 'Yes. Connect Meta Lead Ads or a Google Sheet once and new leads arrive in your workspace on their own. You can still add walk-ins by hand with your own lead form.'],
  ['Do I need to know CAD to make a design?', 'No. You mark the roof on the satellite map, pick the house that looks like the building and say how many floors it has. Panels, structure and strings are worked out from there, and you can adjust any of them.'],
  ['Do my clients get an account?', 'Every client with an email address can get a portal sign-in. There they read their proposals, respond to them, follow their loan and subsidy, book maintenance visits and ask for help. Clients without one simply receive the PDF.'],
  ['How accurate are the energy figures?', 'Sunlight is modelled for the building’s location, and shading from walls, tanks, trees and neighbouring panel rows is worked out hour by hour. Figures are indicative and should be confirmed with a site visit; the proposal says so too.'],
  ['Can my staff only see their own work?', 'Yes. Staff always see the leads, installation steps and maintenance visits assigned to them. Anything more, such as finances, inventory or loans, is granted through roles you define.'],
  ['Can other companies see my data?', 'No. Every client, product, design and image belongs to one company and is only ever loaded for that company’s sign-in.'],
];

/** One question: the answer slides open and closed (its row grows from nothing to its own height). */
function FaqItem({ q, a, open, onToggle, id }) {
  return (
    <div>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[16px] font-semibold text-slate-950 transition-colors hover:text-brand">
          {q}
          <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300', open ? 'rotate-180 border-brand bg-brand text-brand-fg' : 'border-slate-200 text-slate-500')}><ChevronDown className="h-4 w-4" /></span>
        </button>
      </h3>
      <div id={id} role="region" inert={!open} className={cx('lp-faq grid', open && 'is-open')}>
        <div className="overflow-hidden">
          <p className="max-w-[70ch] pb-6 text-[15px] leading-relaxed text-slate-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

const FAQ_FACTS = ['Set up for you by the platform administrator', 'Your own logo, colours, currency and tax', 'A separate sign-in for staff and for clients'];

export default function Faq() {
  const [open, setOpen] = useState(0); // one answer open at a time; the first one to start with
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24 sm:py-32">
      <Container>
        <SectionAnchor id="faq" />
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>FAQ</Eyebrow>
              <Title className="mt-5">Good to know.</Title>
              <Lede className="mt-4 max-w-[40ch]">The questions solar companies ask most before they start: getting a workspace, what the team and the clients can see, and how far to trust the numbers.</Lede>
              <ul className="mt-6 space-y-2.5">
                {FAQ_FACTS.map((t) => <li key={t} className="flex items-start gap-2.5 text-[15px] text-slate-700"><ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" /> {t}</li>)}
              </ul>
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-[16px] font-semibold text-slate-950">Something else on your mind?</div>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-600">Your platform administrator can answer it, and can set up a workspace for your company.</p>
                <Link href="/login" className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-brand hover:underline">Already have a workspace? Sign in <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="divide-y divide-slate-200 self-start rounded-2xl border border-slate-200 bg-white px-6 lg:col-span-8">
            {FAQ.map(([q, a], i) => <FaqItem key={q} id={`faq-${i}`} q={q} a={a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
