'use client';

import { ShieldCheck, Sun } from 'lucide-react';
import { PRODUCT_NAME } from '../layout/Brand';
import Reveal from '../marketing/Reveal';
import { SECONDARY } from './constants';
import { Container, Eyebrow, Lede } from './ui';

const HERO_POINTS = ['Leads to maintenance in one place', 'Your brand on every document', 'A portal for your clients'];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      <div aria-hidden className="lp-glow pointer-events-none absolute inset-x-0 -top-40 h-[720px] bg-[radial-gradient(60%_60%_at_70%_30%,color-mix(in_oklab,var(--brand)_16%,white),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.04)_1px,transparent_1px)] [mask-image:radial-gradient(80%_60%_at_60%_20%,black,transparent)] bg-[size:44px_44px]" />
      <Container className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-16">
        <div className="lg:col-span-6 xl:col-span-6">
          <Reveal><Eyebrow><Sun className="h-3.5 w-3.5" /> Software for solar installation companies</Eyebrow></Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-[16ch] text-[2.6rem] leading-[1.04] font-bold tracking-[-0.035em] text-balance text-slate-950 sm:text-[3.6rem] xl:text-[4.4rem]">
              Run your whole solar business from <span className="text-brand">one workspace</span>.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <Lede className="mt-6 max-w-[52ch]">{PRODUCT_NAME} takes a project from the first enquiry to the last service visit: leads, 3D design, proposals, loans, subsidies, billing, stock, installation and maintenance.</Lede>
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
            <a href="tel:+919918878550" className="inline-flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgb(220_38_38)] transition hover:-translate-y-0.5 hover:bg-red-700">Book a Demo</a>
            <a href="tel:+919918878550" className={SECONDARY}>Contact us</a>
          </Reveal>
          <Reveal delay={300}>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-slate-500">
              {HERO_POINTS.map((p) => <li key={p} className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> {p}</li>)}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={200} className="lg:col-span-6 xl:col-span-6">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-2 pb-3 shadow-[0_30px_80px_-30px_rgba(15,23,42,.35)] backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/images/kanban.png" alt="Solar CRM interactive pipeline" className="w-full rounded-xl" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
