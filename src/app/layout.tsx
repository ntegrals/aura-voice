import './globals.css';
import './button.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import toast, { Toaster } from 'react-hot-toast';
import { DEFAULT_TOAST_OPTIONS } from '@/utils/client/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice Assistant',
  description: 'Siri, but for the web',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster toastOptions={DEFAULT_TOAST_OPTIONS} />
      </body>
    </html>
  );
}
