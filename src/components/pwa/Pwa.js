'use client';

import { RefreshCw, Share, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const DISMISS_KEY = 'sp.pwa.installDismissedAt';
const DISMISS_FOR = 1000 * 60 * 60 * 24 * 14;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Boolean(at) && Date.now() - at < DISMISS_FOR;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch { /* private mode: the banner can show again next visit */ }
}

function standalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function iosDevice() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function markDisplayMode() {
  document.documentElement.classList.toggle('pwa-standalone', standalone());
}

export default function Pwa() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const registration = useRef(null);
  const installEventRef = useRef(null);

  useEffect(() => {
    markDisplayMode();
    const media = window.matchMedia('(display-mode: standalone)');
    const onMode = () => markDisplayMode();
    media.addEventListener?.('change', onMode);

    if (standalone()) return () => media.removeEventListener?.('change', onMode);

    let armed = false;
    const arm = window.setTimeout(() => {
      armed = true;
      if (installEventRef.current && !dismissedRecently()) setShowInstall(true);
    }, 1600);

    const onPrompt = (event) => {
      event.preventDefault();
      installEventRef.current = event;
      setInstallEvent(event);
      setIosHint(false);
      if (armed && !dismissedRecently()) setShowInstall(true);
    };
    const onInstalled = () => {
      setShowInstall(false);
      setIosHint(false);
      setInstallEvent(null);
      installEventRef.current = null;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const iosTimer = window.setTimeout(() => {
      if (iosDevice() && !installEventRef.current && !dismissedRecently() && !standalone()) setIosHint(true);
    }, 4000);

    return () => {
      media.removeEventListener?.('change', onMode);
      window.clearTimeout(arm);
      window.clearTimeout(iosTimer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    // Dev hot reload and frequent rebuilds keep installing a “new” worker — the refresh banner would loop on localhost.
    if (process.env.NODE_ENV !== 'production') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister()))).catch(() => {});
      }
      return undefined;
    }
    if (!('serviceWorker' in navigator)) return undefined;
    let gone = false;
    const watch = (worker) => {
      worker?.addEventListener('statechange', () => {
        if (worker.state !== 'installed') return;
        if (navigator.serviceWorker.controller) setUpdateReady(true);
        else registration.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') registration.current?.update().catch(() => {});
    };

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((reg) => {
      if (gone) return;
      registration.current = reg;
      if (reg.waiting && navigator.serviceWorker.controller) setUpdateReady(true);
      else if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
    }).catch(() => {});

    document.addEventListener('visibilitychange', onVisible);
    const pulse = window.setInterval(onVisible, 60 * 60 * 1000);
    return () => {
      gone = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(pulse);
    };
  }, []);

  const dismissInstall = () => {
    rememberDismiss();
    setShowInstall(false);
    setIosHint(false);
  };

  const install = async () => {
    const event = installEventRef.current;
    if (!event) return;
    event.prompt();
    try {
      await event.userChoice;
    } catch { /* the browser closed the prompt */ }
    installEventRef.current = null;
    setInstallEvent(null);
    setShowInstall(false);
  };

  const refresh = () => {
    const waiting = registration.current?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    let once = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (once) return;
      once = true;
      window.location.reload();
    });
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  if (updateReady) {
    return (
      <Banner
        title="A new version is ready"
        text="Refresh to use the latest SolarDesy. Work you already saved stays saved."
        action="Refresh"
        onAction={refresh}
        icon={<RefreshCw className="h-5 w-5" aria-hidden />}
      />
    );
  }

  if (showInstall && installEvent) {
    return (
      <Banner
        title="Install SolarDesy"
        text="Open it full screen on this phone, tablet or computer, and keep the icon on your home screen."
        action="Install"
        onAction={install}
        onDismiss={dismissInstall}
      />
    );
  }

  if (iosHint) {
    return (
      <Banner
        title="Add SolarDesy to your Home Screen"
        text="Tap Share, then Add to Home Screen. It then opens like an app on this device."
        icon={<Share className="h-5 w-5" aria-hidden />}
        onDismiss={dismissInstall}
      />
    );
  }

  return null;
}

function Banner({ title, text, action, onAction, onDismiss, icon }) {
  return (
    <div
      className="pwa-banner pointer-events-none fixed inset-x-0 z-[65] flex justify-center px-3"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto flex w-full max-w-md animate-fade items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 shadow-[0_12px_40px_rgba(15,23,42,0.16)] sm:p-4">
        <img src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{text}</p>
          {action && (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-[13px] font-semibold text-brand-fg hover:bg-brand-600"
            >
              {icon}
              {action}
            </button>
          )}
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Dismiss" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
