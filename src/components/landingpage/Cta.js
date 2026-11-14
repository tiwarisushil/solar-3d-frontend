'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Reveal from '../marketing/Reveal';
import { Container } from './ui';

export default function Cta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-brand opacity-40 blur-3xl" />
          <h2 className="relative mx-auto max-w-[20ch] text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-white sm:text-[2.75rem]">Ready before the next client calls.</h2>
          <p className="relative mx-auto mt-4 max-w-[48ch] text-[17px] leading-relaxed text-slate-300">Sign in to your company workspace, or ask your platform administrator to set one up.</p>
          <div className="relative mt-8 flex justify-center">
            <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
