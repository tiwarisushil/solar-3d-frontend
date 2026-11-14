'use client';

import Reveal from '../marketing/Reveal';
import { Container, Eyebrow, SectionAnchor, Title } from './ui';

const STEPS = [
  ['A lead comes in', 'From your ads, a sheet or your own form. It is assigned to someone on your team and followed on the board.'],
  ['Design and propose', 'Mark the roof, pick the house, place the panels. The priced proposal goes to the client by link or WhatsApp.'],
  ['Book and bill', 'The client accepts. Loan and subsidy follow their steps; bills, challans and receipts come from your stock and prices.'],
  ['Install and look after', 'Your team works through the installation steps, and maintenance visits are scheduled for the years after.'],
];

export default function How({ stepsRef }) {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionAnchor id="how" />
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <Title className="mt-5">One project, one continuous line.</Title>
        </Reveal>
        <ol ref={stepsRef} className="relative mt-14 grid gap-10 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          <span aria-hidden className="absolute top-5 right-0 left-0 hidden h-px bg-slate-200 xl:block" />
          <span aria-hidden className="lp-line absolute top-5 right-0 left-0 hidden h-px bg-brand xl:block" />
          {STEPS.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 90} className="relative">
              <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-[15px] font-semibold text-brand shadow-sm">{i + 1}</span>
              <h3 className="mt-5 text-[19px] font-semibold text-slate-950">{t}</h3>
              <p className="mt-2 max-w-[38ch] text-[15.5px] leading-relaxed text-slate-600">{d}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
