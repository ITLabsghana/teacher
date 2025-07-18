import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="hsl(226 70% 50%)"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="m22 12-2-2-2 2"/></svg>`;
const faviconDataUri = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;


export const metadata: Metadata = {
  title: 'Teacher Management Software',
  description: 'Manage teachers, schools, and leave requests efficiently.',
  icons: {
    icon: faviconDataUri,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "font-body antialiased bg-background text-foreground",
        inter.variable,
        spaceGrotesk.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
