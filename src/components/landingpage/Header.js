'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cx } from '../kit';
import { LogoMark, LogoText, PRODUCT_NAME } from '../layout/Brand';
import { NAV } from './constants';
import { Container } from './ui';

export default function Header({ scrolled }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={cx('fixed inset-x-0 z-40 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] transition-all duration-300 top-[env(safe-area-inset-top,0px)]', scrolled || open ? 'border-b border-slate-200 bg-white/85 backdrop-blur-md' : 'border-b border-transparent')}>
      <div aria-hidden className="lp-progress absolute inset-x-0 top-0 h-0.5 bg-brand" />
      <Container className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <Link href="/" aria-label={`${PRODUCT_NAME} home`} className="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-slate-950 sm:gap-2.5"><LogoMark size={32} /> <LogoText /></Link>
        <nav aria-label="Main" className="hidden items-center justify-center gap-10 lg:flex">
          {NAV.map(([label, href]) => <a key={href} href={href} className="text-[17px] font-medium text-slate-700 transition hover:text-amber-600">{label}</a>)}
        </nav>
        <div className="flex items-center justify-end gap-2 sm:gap-4">
          <Link href="/login" className="hidden text-[17px] font-medium text-slate-700 transition hover:text-amber-600 sm:inline-flex">Log in</Link>
          <Link href="/free-proposal" className="inline-flex h-10 shrink-0 items-center rounded-full bg-brand px-3.5 text-[13px] font-semibold whitespace-nowrap text-brand-fg transition hover:bg-brand-600 sm:h-11 sm:px-5 sm:text-[15px]">Free Proposal</Link>
          <a href="#contact" className="inline-flex h-10 shrink-0 items-center rounded-full bg-red-600 px-4 text-[14px] font-semibold whitespace-nowrap text-white transition hover:bg-red-700 sm:h-11 sm:px-6 sm:text-[16px]">Book a Demo</a>
          <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full text-slate-800 hover:bg-slate-100 lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </Container>
      {open && (
        <nav aria-label="Mobile" className="animate-fade max-h-[min(70dvh,calc(100dvh-5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))] overflow-y-auto border-t border-slate-200 bg-white px-5 py-2 lg:hidden">
          {NAV.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-slate-100 py-3.5 text-[15px] font-medium text-slate-800">{label}</a>)}
          <Link href="/free-proposal" onClick={() => setOpen(false)} className="block border-b border-slate-100 py-3.5 text-[15px] font-semibold text-amber-700">Free Proposal</Link>
          {/* on phones the header has no room for "Log in", so it goes in the menu */}
          <Link href="/login" onClick={() => setOpen(false)} className="block py-3.5 text-[15px] font-medium text-slate-800 sm:hidden">Log in</Link>
        </nav>
      )}
    </header>
  );
}
