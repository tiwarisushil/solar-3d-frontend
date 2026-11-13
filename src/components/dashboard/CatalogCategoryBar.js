'use client';

import { Boxes, ChevronDown, Package, PanelsTopLeft, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buttonClass, cx } from '../kit';

function categoryIcon(type) {
  if (type === 'panels') return PanelsTopLeft;
  if (type === 'poles') return Boxes;
  return Package;
}

function tabButtonClass(active) {
  return cx(
    '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
    active ? 'border-brand text-brand-ink' : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800',
  );
}

function countBadgeClass(active) {
  return cx(
    'min-w-[1.25rem] rounded-full px-2 py-px text-center text-xs tabular-nums',
    active ? 'bg-brand/15 font-medium text-brand-ink' : 'bg-slate-100 text-slate-600',
  );
}

function MoreCategoriesTab({ categories, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const listId = useId();

  const close = () => {
    setOpen(false);
    setMenuPos(null);
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 220);
    const maxH = Math.min(320, categories.length * 40 + 8);
    const preferUp = window.innerHeight - r.bottom < maxH + 12 && r.top > maxH + 12;
    setMenuPos({
      left: r.left,
      width,
      maxHeight: maxH,
      ...(preferUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const inside = (t) => trigger.current?.contains(t) || menu.current?.contains(t);
    const onPointer = (e) => !inside(e.target) && close();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        trigger.current?.focus();
      }
    };
    const onScroll = (e) => !menu.current?.contains(e.target) && close();
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        role="tab"
        aria-selected={false}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={toggle}
        className={tabButtonClass(false)}
      >
        <span>More categories</span>
        <span className={countBadgeClass(false)}>{categories.length}</span>
        <ChevronDown className={cx('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && menuPos && createPortal(
        <div
          ref={menu}
          id={listId}
          role="listbox"
          aria-label="More categories"
          style={menuPos}
          className="fixed z-[50] flex animate-pop flex-col overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
        >
          <ul className="min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => {
              const Icon = categoryIcon(c.type);
              return (
                <li key={c.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                    onClick={() => {
                      onChange(c.id);
                      close();
                      trigger.current?.focus();
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-px text-xs tabular-nums text-slate-600">{c.products}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Category tabs (first three + overflow) with matching “More categories” menu. */
export function CatalogCategoryBar({ shown, more, tab, onTab, mastersPath }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Product categories" className="flex min-w-0 max-w-full flex-wrap items-end gap-0.5 border-b border-slate-200">
        {shown.map((c) => {
          const Icon = categoryIcon(c.type);
          const active = tab === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTab(c.id)}
              className={tabButtonClass(active)}
            >
              <Icon className={cx('h-4 w-4 shrink-0', active ? 'text-brand-ink' : 'text-slate-400')} />
              <span>{c.name}</span>
              <span className={countBadgeClass(active)}>{c.products}</span>
            </button>
          );
        })}
        {more.length > 0 && <MoreCategoriesTab categories={more} onChange={onTab} />}
      </div>
      <Link href={mastersPath} className={buttonClass({ variant: 'secondary', size: 'sm', className: 'shrink-0' })}>
        <Settings2 className="h-3.5 w-3.5" />
        Manage categories
      </Link>
    </div>
  );
}
