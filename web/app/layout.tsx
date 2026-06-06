import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import './globals.css';
import { SocketBridge } from '@/lib/socket';

export const metadata: Metadata = {
  title: 'VedaAI Assessment Creator',
  description: 'AI-powered assessment creation and question paper generation'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SocketBridge />
        {children}
      </body>
    </html>
  );
}
