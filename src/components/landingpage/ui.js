import { cx } from '../kit';

// the page uses nearly the whole width of the screen (it stops growing on very large monitors)
export const Container = ({ className, children }) => <div className={cx('mx-auto w-full max-w-[1720px] px-5 sm:px-8 lg:px-14', className)}>{children}</div>;
export const Eyebrow = ({ children, className }) => <p className={cx('inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-[13px] font-medium text-brand-ink', className)}>{children}</p>;
export const Title = ({ children, className }) => <h2 className={cx('text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-slate-950 sm:text-[2.6rem]', className)}>{children}</h2>;
export const Lede = ({ children, className }) => <p className={cx('text-[17px] leading-relaxed text-pretty text-slate-600', className)}>{children}</p>;
// nav links land here (under the fixed header), not on the section's top padding
export const SectionAnchor = ({ id }) => <div id={id} className="pointer-events-none scroll-mt-24" />;

/**
 * A feature's picture. The drawings are plain SVG files kept in public/landing/features (one per feature).
 */
// eslint-disable-next-line @next/next/no-img-element -- small static SVGs: nothing for the image optimiser to do
export const FeatureArt = ({ name, className }) => <img src={`/landing/features/${name}.svg`} alt="" width={64} height={64} loading="lazy" decoding="async" className={className} />;

export const Frame = ({ title, className, children }) => (
  <div className={cx('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
      <span className="ml-3 truncate rounded-md bg-white px-3 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">{title}</span>
    </div>
    {children}
  </div>
);

// the WhatsApp logo (lucide-react only has a generic chat bubble)
export const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);
