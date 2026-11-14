'use client';

import Link from 'next/link';
import { LogoMark, PRODUCT_NAME } from '../layout/Brand';
import Reveal from '../marketing/Reveal';
import { PRIMARY } from './constants';
import { Container } from './ui';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28 lg:min-h-[min(92dvh,920px)] lg:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_8%_-10%,color-mix(in_oklab,var(--brand)_28%,transparent),transparent_58%),radial-gradient(45%_40%_at_92%_12%,color-mix(in_oklab,#fb923c_14%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(15,23,42,.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_55%_at_30%_20%,black,transparent)]"
      />

      <Container className="relative grid min-h-[inherit] items-center gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-6 xl:gap-10">
        <div className="relative z-10 max-w-xl py-4 lg:py-10">
          <Reveal>
            <div className="flex items-center gap-3">
              <LogoMark size={44} />
              <span className="text-[1.55rem] font-bold tracking-tight sm:text-[1.85rem]">
                <span className="text-yellow-500">Solar</span>
                <span className="text-red-600">DESY</span>
              </span>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-8 text-[2.7rem] leading-[0.98] font-bold tracking-[-0.045em] text-balance text-slate-950 sm:text-[3.8rem] xl:text-[4.55rem]">
              Rooftops,
              <br />
              designed in{' '}
              <span className="relative inline-block text-brand">
                3D
                <span aria-hidden className="absolute -bottom-1 left-0 h-[0.22em] w-full rounded-full bg-brand/40" />
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-[34ch] text-[17px] leading-relaxed text-pretty text-slate-600 sm:text-[18px]">
              Place panels on a live model of the site, then turn that design into a proposal your client can say yes to.
            </p>
          </Reveal>

          <Reveal delay={230} className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#contact"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 text-[15px] font-semibold text-white shadow-[0_12px_28px_-12px_rgb(220_38_38)] transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Book a Demo
            </a>
            <Link href="/free-proposal" className={PRIMARY}>
              Free Proposal
            </Link>
          </Reveal>
        </div>

        <Reveal delay={140} className="relative lg:h-full">
          <div className="lp-float relative mx-auto w-full max-w-[640px] lg:absolute lg:inset-y-6 lg:-right-14 lg:left-0 lg:mx-0 lg:max-w-none xl:-right-20">
            <div
              aria-hidden
              className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_40%_40%,color-mix(in_oklab,var(--brand)_35%,transparent),transparent_70%)] blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/images/heroimage.png"
              alt={`${PRODUCT_NAME} 3D rooftop solar design`}
              width={1600}
              height={1200}
              className="aspect-[4/3] w-full rounded-[1.4rem] object-contain object-center drop-shadow-[0_36px_80px_rgba(15,23,42,.28)] sm:rounded-[1.75rem] lg:aspect-auto lg:h-full lg:min-h-[420px] lg:rounded-l-[1.75rem] lg:rounded-r-none lg:object-contain lg:object-center"
            />
          </div>
        </Reveal>
      </Container>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
