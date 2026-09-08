import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Inter } from 'next/font/google';

import { AppShell } from '@/components/layout/AppShell';

import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-chakra-petch',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ParkLogic — Operations Control',
    template: '%s · ParkLogic',
  },
  description:
    'Real-time parking allocation, visitor access, EV charging, and access control operations for commercial properties.',
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${chakraPetch.variable} ${inter.variable} min-h-full font-sans`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
