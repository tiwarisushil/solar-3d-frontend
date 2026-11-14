'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from './cx';

const inputClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand-muted/60';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** `YYYY-MM-DD` -> `DD/MM/YYYY` (display only). */
function toDisplay(iso) {
  const m = ISO_RE.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** `DD/MM/YYYY` -> `YYYY-MM-DD` when it is a real calendar date, else null. */
function fromDisplay(text) {
  const m = DMY_RE.exec(text || '');
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** Keeps digits only and inserts slashes while typing: 1011 2026 -> 10/11/2026. */
function formatTyping(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `/${digits.slice(4)}`;
  return out;
}

/** Text date input that shows and types DD/MM/YYYY; value and onChange use YYYY-MM-DD. */
export function DateField({ value = '', onChange, ariaLabel, className }) {
  const [text, setText] = useState(toDisplay(value));
  const pickerRef = useRef(null);

  useEffect(() => {
    setText(toDisplay(value));
  }, [value]);

  function handleType(e) {
    const next = formatTyping(e.target.value);
    setText(next);
    if (!next) {
      if (value) onChange('');
      return;
    }
    const iso = fromDisplay(next);
    if (iso && iso !== value) onChange(iso);
  }

  function openCalendar() {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  }

  return (
    <div className={cx('relative inline-flex', className)}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        aria-label={ariaLabel}
        value={text}
        onChange={handleType}
        onBlur={() => setText(toDisplay(value))}
        className={cx(inputClass, 'w-36 pr-8')}
      />
      <button
        type="button"
        onClick={openCalendar}
        aria-label="Open calendar"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
    </div>
  );
}

/** Local `YYYY-MM-DD` for a date, offset by `days`. */
function localIso(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Set both dates to filter lists on the server; clear both to show all. Values are `YYYY-MM-DD`.
 * Pass `label` to show a heading with a Today button (sets From = yesterday, to = today).
 */
export function DateRangeFilter({ label, from = '', to = '', onChange, className }) {
  const active = Boolean(from && to);

  const range = (
    <div className={cx('flex flex-wrap items-center gap-3 text-sm text-slate-600', className)}>
      <label className="flex items-center gap-2">
        <span className="whitespace-nowrap">From</span>
        <DateField ariaLabel="From date" value={from} onChange={(v) => onChange({ from: v, to })} />
      </label>
      <label className="flex items-center gap-2">
        <span>to</span>
        <DateField ariaLabel="Added to" value={to} onChange={(v) => onChange({ from, to: v })} />
      </label>
      {active && (
        <button type="button" onClick={() => onChange({ from: '', to: '' })} className="font-medium text-brand hover:underline">
          Clear dates
        </button>
      )}
    </div>
  );

  if (!label) return range;

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[13px] font-medium text-slate-700">{label}</span>
        <button
          type="button"
          onClick={() => onChange({ from: localIso(-1), to: localIso(0) })}
          className="rounded-md border border-brand/30 bg-white px-2 py-0.5 text-xs font-semibold text-brand hover:bg-brand-muted/40"
          title="Set From to yesterday and to to today"
        >
          Today
        </button>
      </div>
      {range}
    </div>
  );
}
