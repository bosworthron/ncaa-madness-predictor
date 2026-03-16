// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'March Madness Edge Finder',
  description: 'Bartek model vs Vegas: find the spread and total edges in the 2026 NCAA Tournament',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={`${inter.className} text-white min-h-screen`}>{children}</body>
    </html>
  );
}
