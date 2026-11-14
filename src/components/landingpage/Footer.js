'use client';

import Link from 'next/link';
import { LogoMark, LogoText, PRODUCT_NAME } from '../layout/Brand';
import { Container } from './ui';

export default function Footer() {
  const cols = [
    ['Product', [['All features', '#features'], ['3D design', '#design'], ['Proposals', '#proposals'], ['Client portal', '#portal'], ['How it works', '#how'], ['Contact', '#contact'], ['FAQ', '#faq']]],
    ['Workspace', [['Sign in', '/login'], ['Company dashboard', '/dashboard'], ['Staff workspace', '/agent'], ['Client portal', '/portal']]],
  ];
  return (
    <footer className="border-t border-slate-200">
      <Container className="grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-6">
          <span className="flex items-center gap-2.5 text-[16px] font-semibold tracking-tight text-slate-950"><LogoMark size={28} /> <LogoText /></span>
          <p className="mt-4 max-w-[40ch] text-[14.5px] leading-relaxed text-slate-500">The workspace for solar installation companies: leads, design, proposals, loans, subsidies, billing, stock, installations and maintenance.</p>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title} className="md:col-span-3">
            <div className="text-[13px] font-semibold tracking-wide text-slate-950 uppercase">{title}</div>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">{links.map(([label, href]) => <li key={label}>{href.startsWith('#') ? <a href={href} className="text-slate-600 hover:text-slate-950">{label}</a> : <Link href={href} className="text-slate-600 hover:text-slate-950">{label}</Link>}</li>)}</ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-slate-200"><Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-[13px] text-slate-500"><span>© {new Date().getFullYear()} {PRODUCT_NAME}</span><span>Made for solar installers</span></Container></div>
    </footer>
  );
}
