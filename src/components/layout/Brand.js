import { Sun } from 'lucide-react';
import { cx } from '../kit';

export const PRODUCT_NAME = 'SolarDesy';

export function BrandMark({ size = 32, className }) {
  return (
    <span style={{ width: size, height: size }} className={cx('grid shrink-0 place-items-center rounded-lg bg-brand text-brand-fg', className)}>
      <Sun style={{ width: size * 0.56, height: size * 0.56 }} />
    </span>
  );
}

/* The landing page's logo, shared by its navbar, footer and the other public pages so they all match. */

/** "Solar" in yellow and "DESY" in red. */
export function LogoText() {
  return (
    <span className="text-[16px] font-bold min-[400px]:text-[20px]">
      <span className="text-yellow-500">Solar</span><span className="text-red-600">DESY</span>
    </span>
  );
}

/** The sun on a yellow tile, to match the logo text. */
export function LogoMark({ size = 32 }) {
  return (
    <span style={{ width: size, height: size, background: '#F5B82E' }} className="grid shrink-0 place-items-center rounded-lg text-slate-900">
      <Sun style={{ width: size * 0.56, height: size * 0.56 }} />
    </span>
  );
}

export function BrandLogo({ className, dark }) {
  return (
    <span className={cx('flex items-center gap-2.5 text-[15px] font-semibold tracking-tight', dark ? 'text-white' : 'text-slate-900', className)}>
      <BrandMark /> {PRODUCT_NAME}
    </span>
  );
}
