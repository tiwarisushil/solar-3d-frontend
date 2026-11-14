'use client';

import { cx } from '../kit';
import Reveal from '../marketing/Reveal';
import { PRIMARY, WHATSAPP_URL } from './constants';
import { Container, Eyebrow, Lede, SectionAnchor, Title, WhatsAppIcon } from './ui';

// For now only a contact option: the plans are shared by the sales team, so the button opens a WhatsApp chat.
export default function Pricing() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="text-center">
        <SectionAnchor id="pricing" />
        <Reveal className="mx-auto flex max-w-[60ch] flex-col items-center">
          <Eyebrow>Price</Eyebrow>
          <Title className="mt-5 max-w-[22ch]">Pricing that fits your company.</Title>
          <Lede className="mt-5 max-w-[52ch]">Every solar company is different in size and in what it needs. Tell us about yours and we will share the plan that suits it.</Lede>
        </Reveal>
        <Reveal delay={100} className="mx-auto mt-14 flex max-w-xl flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <div className="text-[13px] font-semibold tracking-wide text-brand uppercase">Contact</div>
          <h3 className="mt-2 text-[1.5rem] leading-tight font-semibold tracking-tight text-slate-950">Talk to our team</h3>
          <p className="mt-3 text-[15.5px] leading-relaxed text-slate-600">Message us on WhatsApp with your company name and team size. We will reply with the pricing and a demo.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={cx(PRIMARY, 'mt-8')}><WhatsAppIcon className="h-[18px] w-[18px]" /> Contact us on WhatsApp</a>
        </Reveal>
      </Container>
    </section>
  );
}
