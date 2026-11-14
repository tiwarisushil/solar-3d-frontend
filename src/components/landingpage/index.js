'use client';

import Lenis from 'lenis';
import { useEffect, useRef, useState } from 'react';
import Contact from './Contact';
import Cta from './Cta';
import Faq from './Faq';
import Features from './Features';
import FloatingContact from './FloatingContact';
import Footer from './Footer';
import Header from './Header';
import Hero from './Hero';
import How from './How';
import Pricing from './Pricing';
import ServiceBackdrop from './ServiceBackdrop';
import Spotlights from './Spotlights';
import Strip from './Strip';
import { PAGE_THEME, STYLES } from './theme';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  // the page scrolls inside this container (the app shell keeps <body> fixed)
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const stepsRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return undefined;

    // everything the scroll position moves is a CSS variable, so no React render happens while scrolling
    const apply = () => {
      const y = root.scrollTop;
      const limit = Math.max(1, root.scrollHeight - root.clientHeight);
      root.style.setProperty('--lp-progress', clamp01(y / limit).toFixed(4));
      root.style.setProperty('--lp-y', y.toFixed(0));
      const steps = stepsRef.current;
      if (steps) {
        const r = steps.getBoundingClientRect();
        steps.style.setProperty('--lp-steps', clamp01((root.clientHeight * 0.85 - r.top) / (root.clientHeight * 0.5)).toFixed(4));
      }
      setScrolled(y > 24);
    };
    apply();

    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Lenis already honours each section's scroll-margin-top (scroll-mt-*), so do not add a second offset
    let lenis = null;
    if (!calm) {
      lenis = new Lenis({ wrapper: root, content, lerp: 0.09, wheelMultiplier: 1, smoothWheel: true, autoRaf: true });
      lenis.on('scroll', apply);
    } else {
      root.addEventListener('scroll', apply, { passive: true });
    }

    // the page scrolls inside `root`, not the window, so hash links must be handled here
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = content.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      else {
        // reduced motion: land under the fixed header using the section's scroll-margin
        const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 96;
        const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - margin;
        root.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      }
      history.replaceState(null, '', href);
    };
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      if (lenis) lenis.destroy();
      else root.removeEventListener('scroll', apply);
    };
  }, []);

  return (
    <div ref={rootRef} style={PAGE_THEME} className="lp h-dvh overflow-x-hidden overflow-y-auto bg-white text-slate-900 antialiased">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <ServiceBackdrop />
      <div ref={contentRef} className="relative z-10">
        <Header scrolled={scrolled} />
        <main>
          <Hero />
          <Strip />
          <Features />
          <Spotlights />
          <How stepsRef={stepsRef} />
          <Pricing />
          <Contact />
          <Faq />
          <Cta />
        </main>
        <Footer />
      </div>
      <FloatingContact />
    </div>
  );
}
