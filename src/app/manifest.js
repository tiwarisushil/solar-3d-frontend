export default function manifest() {
  return {
    id: '/',
    name: 'SolarDesy',
    short_name: 'SolarDesy',
    description: 'A workspace for solar companies: manage clients, design rooftop systems in 3D and send branded proposals.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#f4f6f9',
    theme_color: '#1d4ed8',
    lang: 'en',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Sign in', short_name: 'Sign in', url: '/login', description: 'Open your workspace' },
      { name: 'Free proposal', short_name: 'Proposal', url: '/free-proposal', description: 'Start a free solar proposal' },
    ],
  };
}
