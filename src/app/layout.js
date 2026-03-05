import { Inter, JetBrains_Mono, Smooch } from 'next/font/google';
import './globals.css';
import PWARegister from '@/components/pwa/PWARegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const smooch = Smooch({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-smooch',
  display: 'swap',
});

export const metadata = {
  title: '#teamincrix',
  description: 'Content management system for creative studios',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '#teamincrix',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  themeColor: '#0d0d0d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${smooch.variable}`}>
      <body className="antialiased font-sans bg-[#0d0d0d] text-white">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
