import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Assam Hazard Guard',
  description: 'Automated real-time natural hazard warning engine, seismic locator, and safe evacuation shelter router for Assam, India.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232563eb%22/><path d=%22M50 82s28-14 28-35V27.5L50 17 22 27.5V47c0 21 28 35 28 35z%22 fill=%22none%22 stroke=%22white%22 stroke-width=%228%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/><line x1=%2250%22 y1=%2238%22 x2=%2250%22 y2=%2252%22 stroke=%22white%22 stroke-width=%228%22 stroke-linecap=%22round%22/><line x1=%2250%22 y1=%2266%22 x2=%2250.01%22 y2=%2266%22 stroke=%22white%22 stroke-width=%228%22 stroke-linecap=%22round%22/></svg>',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <LanguageProvider>
          <Navbar />
          <div className="layout-content-wrapper">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
