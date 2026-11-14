import { hexToRgb } from '@/lib/theme';

// the landing page's own palette (the product mocks follow it); workspaces use each company's theme
export const BRAND = '#F5B82E';
export const ACCENT = '#F5B82E';

export const PAGE_THEME = { '--brand': BRAND, '--brand-fg': '#1c1917', '--accent': ACCENT, '--accent-fg': '#1c1917' };

const mix = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));
const rgb = (c) => `rgb(${c.join(',')})`;

/** CSS variables that theme <ProposalMock>: the same palette rules the real PDF cover uses. */
export function proposalVars(primaryHex, accentHex) {
  const p = hexToRgb(primaryHex);
  const a = hexToRgb(accentHex);
  return { '--p': rgb(p), '--a': rgb(a), '--ink': rgb(mix(p, [6, 12, 20], 0.72)), '--deep': rgb(mix(p, [0, 0, 0], 0.45)), '--panel': rgb(mix(p, [244, 246, 248], 0.94)), '--cream': rgb(mix(a, [255, 255, 255], 0.9)) };
}

// The page's own styles: what Reveal fades, the marquee, and the pieces the scroll position moves.
export const STYLES = `
.lp { font-family: var(--font-poppins), system-ui, sans-serif; }
.lp .reveal { opacity: 0; transform: translateY(26px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); transition-delay: var(--reveal-delay, 0ms); will-change: opacity, transform; }
.lp .reveal.is-visible { opacity: 1; transform: none; }
.lp.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lp.lenis.lenis-stopped { overflow: clip; }
.lp-progress { transform: scaleX(var(--lp-progress, 0)); transform-origin: 0 50%; }
.lp-glow { transform: translate3d(0, calc(var(--lp-y, 0) * .25px), 0); }
.lp-line { transform: scaleX(var(--lp-steps, 0)); transform-origin: 0 50%; }
.lp-marquee { animation: lp-marquee 48s linear infinite; }
.lp-marquee-wrap:hover .lp-marquee { animation-play-state: paused; }
@keyframes lp-marquee { to { transform: translateX(-50%); } }
.lp-faq { grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .45s cubic-bezier(.22,1,.36,1), opacity .35s ease; }
.lp-faq.is-open { grid-template-rows: 1fr; opacity: 1; }
.lp-card { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s, border-color .35s; }
.lp-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -18px rgba(15,23,42,.22); border-color: color-mix(in oklab, var(--brand) 35%, white); }
.lp-art { transition: transform .45s cubic-bezier(.22,1,.36,1); }
.lp-card:hover .lp-art { transform: scale(1.08) rotate(-3deg); }
.lp-float { animation: lp-float 7s ease-in-out infinite; }
@keyframes lp-float { 50% { transform: translateY(-10px); } }
@media (prefers-reduced-motion: reduce) {
  .lp .reveal { opacity: 1; transform: none; transition: none; }
  .lp-glow { transform: none; }
  .lp-marquee, .lp-float { animation: none; }
  .lp-faq { transition: none; }
  .lp-line { transform: none; }
}
`;
