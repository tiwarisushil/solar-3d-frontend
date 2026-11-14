'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cx } from '../kit';
import { PRODUCT_NAME } from '../layout/Brand';
import Reveal from '../marketing/Reveal';
import { PortalPhone } from '../marketing/scenes';
import { ProposalMock } from '../marketing/visuals';
import { PRIMARY } from './constants';
import { ACCENT, BRAND, proposalVars } from './theme';
import { Container, Eyebrow, Frame, Lede, SectionAnchor, Title } from './ui';

function Points({ items }) {
  return (
    <ul className="mt-7 space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-[15.5px] leading-relaxed text-slate-700">
          <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-brand-fg"><svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Spotlight({ id, tone, eyebrow, title, lede, points, flip, cta, children }) {
  return (
    <section className={cx('py-20 sm:py-28', tone)}>
      <Container>
        {id ? <SectionAnchor id={id} /> : null}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className={cx(flip && 'lg:order-2')}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title className="mt-5">{title}</Title>
            <Lede className="mt-4">{lede}</Lede>
            <Points items={points} />
            {cta}
          </Reveal>
          <Reveal delay={120} className={cx(flip && 'lg:order-1')}>{children}</Reveal>
        </div>
      </Container>
    </section>
  );
}

export default function Spotlights() {
  return (
    <>
      <Spotlight
        id="design"
        tone="bg-slate-50 border-y border-slate-200"
        eyebrow="3D design"
        title="A real-looking design in a few taps."
        lede="Your sales staff can make it in front of the customer. No drawing skills needed."
        points={['Find the address and mark the roof on the satellite picture', 'Pick the type of house and its floors, or choose ground mounted', 'Size the system by the monthly bill or by kW', 'Panels, structure, strings and price are worked out together']}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_30px_70px_-30px_rgba(15,23,42,.3)]">
          <Frame title={`${PRODUCT_NAME} · Designer · Panels`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot from public/landing */}
            <img src="/landing/images/threeddesign.png" alt="The 3D designer: a building with its roof filled with solar panels, a water tank and the mounting frames" width={1917} height={912} loading="lazy" className="block w-full" />
          </Frame>
        </div>
      </Spotlight>
      <Spotlight
        id="proposals"
        flip
        eyebrow="Proposals"
        title="A proposal your client is glad to open."
        lede="Your logo, your colours and your terms on every page, made from the design with one press."
        points={['The 3D model, bill of materials, drawings and savings outlook', 'Share a link, a QR code or send it on WhatsApp', 'Clients accept or ask for changes online', 'Subsidy and loan shown next to the price']}
        cta={(
          <div className="mt-9">
            <Link href="/free-proposal" className={PRIMARY}>Create your free proposal <ArrowRight className="h-4 w-4" /></Link>
            <p className="mt-3 text-[14px] text-slate-500">No sign-in needed. Enter your details, the items and the price, pick a design and download the PDF.</p>
          </div>
        )}
      >
        <div className="lp-float mx-auto max-w-[420px]"><ProposalMock style={proposalVars(BRAND, ACCENT)} /></div>
      </Spotlight>
      <Spotlight
        id="portal"
        tone="bg-slate-50 border-y border-slate-200"
        eyebrow="Client portal"
        title="Your clients always know where things stand."
        lede="Fewer “any update?” calls. Each client gets a sign-in of their own."
        points={['Read and answer proposals', 'Follow the loan and the subsidy step by step', 'Book maintenance visits', 'Ask for help with photos and documents']}
      >
        <div className="lp-float"><PortalPhone /></div>
      </Spotlight>
    </>
  );
}
