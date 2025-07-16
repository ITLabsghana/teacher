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

export const metadata: Metadata = {
  title: 'Teacher Management Software',
  description: 'Manage teachers, schools, and leave requests efficiently.',
  icons: {
    icon: 'data:;base64,iVBORw0KGgo=',
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
