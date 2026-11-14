import { PRODUCT_NAME } from '../layout/Brand';

export const NAV = [['Platform', '#features'], ['How it works', '#how'], ['Price', '#pricing'], ['Contact', '#contact']];

export const CONTACT_FIELD = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10';

// the sales number, and a WhatsApp chat with it that opens with a ready message
export const WHATSAPP_URL = `https://wa.me/919918878550?text=${encodeURIComponent(`Hi, I would like to know the pricing of ${PRODUCT_NAME}.`)}`;

export const PRIMARY = 'inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-semibold text-brand-fg shadow-[0_10px_24px_-10px_var(--brand)] transition hover:-translate-y-0.5 hover:bg-brand-600';
export const SECONDARY = 'inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400';
