/* Solar line-art behind the whole page: sun, panels, inverter, battery, a roof, cables and a bolt. Fixed to the
   screen so it stays put while scrolling; sections with their own background cover it, the rest shows it faintly. */
export default function ServiceBackdrop() {
  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full text-brand opacity-[.1]" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(150 130)">
        <circle r="46" />
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1="0" y1="-66" x2="0" y2="-90" transform={`rotate(${i * 45})`} />)}
      </g>
      <g transform="translate(1160 150) skewY(-12)">
        <rect width="270" height="160" rx="6" />
        {[1, 2, 3].map((i) => <line key={`h${i}`} x1="0" y1={i * 40} x2="270" y2={i * 40} />)}
        {[1, 2, 3, 4, 5].map((i) => <line key={`v${i}`} x1={i * 45} y1="0" x2={i * 45} y2="160" />)}
      </g>
      <g transform="translate(1210 760) skewY(-12)">
        <rect width="210" height="125" rx="6" />
        {[1, 2].map((i) => <line key={`h${i}`} x1="0" y1={i * 42} x2="210" y2={i * 42} />)}
        {[1, 2, 3, 4].map((i) => <line key={`v${i}`} x1={i * 42} y1="0" x2={i * 42} y2="125" />)}
      </g>
      <g transform="translate(60 560)">
        <rect width="92" height="132" rx="8" />
        <circle cx="46" cy="30" r="6" />
        <line x1="20" y1="70" x2="72" y2="70" />
        <line x1="20" y1="90" x2="72" y2="90" />
        <line x1="20" y1="110" x2="56" y2="110" />
      </g>
      <g transform="translate(980 640)">
        <rect width="140" height="72" rx="8" />
        <rect x="140" y="24" width="10" height="24" />
        <line x1="30" y1="18" x2="30" y2="54" />
        <line x1="60" y1="18" x2="60" y2="54" />
        <line x1="90" y1="18" x2="90" y2="54" />
      </g>
      <g transform="translate(300 700)">
        <path d="M0 90 L100 0 L200 90" />
        <path d="M22 90 V180 H178 V90" />
        <rect x="84" y="120" width="32" height="60" />
        <path d="M52 40 L86 14 L120 40 L120 47 L52 47 Z" />
      </g>
      <path d="M700 70 L660 170 L700 170 L670 262 L750 140 L708 140 L742 70 Z" />
      <path d="M0 930 C 200 880, 400 980, 600 930 S 1000 880, 1200 930 S 1500 980, 1600 920" />
      <circle cx="820" cy="520" r="10" />
      <circle cx="1440" cy="470" r="8" />
      <circle cx="520" cy="360" r="6" />
    </svg>
  );
}
