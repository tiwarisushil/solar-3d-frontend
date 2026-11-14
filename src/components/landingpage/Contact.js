'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cx } from '../kit';
import Reveal from '../marketing/Reveal';
import { CONTACT_FIELD, PRIMARY } from './constants';
import { Container, Eyebrow, Lede, SectionAnchor, Title } from './ui';

const EMPTY_CONTACT = { name: '', email: '', phone: '', company: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => setDone(false), 3000);
    return () => clearTimeout(timer);
  }, [done]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/public/contact-messages', { method: 'POST', body: form });
      setDone(true);
      setForm(EMPTY_CONTACT);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setBusy(false);
  };

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24 sm:py-32">
      <Container>
        <SectionAnchor id="contact" />
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5 lg:sticky lg:top-28">
            <Eyebrow>Contact</Eyebrow>
            <Title className="mt-5 max-w-[18ch]">Tell us about your company.</Title>
            <Lede className="mt-5 max-w-[40ch]">Leave your details and a short note. We will get back to you about a demo or pricing.</Lede>
            <ul className="mt-8 space-y-3 text-[15px] text-slate-700">
              {['Book a product demo', 'Ask about pricing for your team', 'Get help setting up a workspace'].map((t) => (
                <li key={t} className="flex items-start gap-2.5"><ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" /> {t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-ink"><ShieldCheck className="h-6 w-6" /></div>
                <h3 className="mt-4 text-[1.35rem] font-semibold text-slate-950">Message sent</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Thanks — we have your details and will reply soon.</p>
                <button type="button" onClick={() => setDone(false)} className="mt-6 text-[14.5px] font-semibold text-brand-ink hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[14px] font-medium text-slate-800">Your name</span>
                  <input required maxLength={120} autoComplete="name" className={CONTACT_FIELD} value={form.name} onChange={set('name')} placeholder="Your full name" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[14px] font-medium text-slate-800">Email</span>
                  <input required type="email" maxLength={160} autoComplete="email" className={CONTACT_FIELD} value={form.email} onChange={set('email')} placeholder="you@company.com" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[14px] font-medium text-slate-800">Mobile</span>
                  <input required maxLength={20} autoComplete="tel" inputMode="tel" className={CONTACT_FIELD} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px] font-medium text-slate-800"><span>Company</span><span className="text-[12.5px] font-normal text-slate-400">optional</span></span>
                  <input maxLength={160} autoComplete="organization" className={CONTACT_FIELD} value={form.company} onChange={set('company')} placeholder="Your solar company" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[14px] font-medium text-slate-800">Message</span>
                  <textarea required maxLength={4000} rows={4} className={cx(CONTACT_FIELD, 'h-auto min-h-[7rem] resize-y py-3')} value={form.message} onChange={set('message')} placeholder="What would you like to know?" />
                </label>
                {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
                <div className="sm:col-span-2">
                  <button type="submit" disabled={busy} className={cx(PRIMARY, 'w-full justify-center disabled:translate-y-0 disabled:opacity-70')}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {busy ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
