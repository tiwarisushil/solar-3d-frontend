import { Geist, Geist_Mono, Poppins } from 'next/font/google';
import { LightboxHost, PdfViewerHost } from '@/components/kit';
import Pwa from '@/components/pwa/Pwa';
import RouteTracker from '@/components/RouteTracker';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
// used by the public landing page (and other marketing pages that opt in)
const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const description = 'A workspace for solar companies: manage clients, design rooftop systems in 3D and send branded proposals.';

export const metadata = {
  applicationName: 'SolarDesy',
  title: 'SolarDesy — rooftop solar design & proposals',
  description,
  appleWebApp: { capable: true, title: 'SolarDesy', statusBarStyle: 'default' },
  formatDetection: { telephone: false, email: false, address: false },
  // older iPhones still read this name; current ones use mobile-web-app-capable, which Next emits from appleWebApp
  other: { 'apple-mobile-web-app-capable': 'yes' },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5B82E',
  colorScheme: 'light',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden">
        {children}
        <RouteTracker />
        <LightboxHost />
        <PdfViewerHost />
        <Pwa />
      </body>
    </html>
  );
}
