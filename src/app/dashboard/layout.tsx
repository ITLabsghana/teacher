
"use client";

import { useEffect, type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { School, User as TeacherIcon, CalendarOff, LayoutDashboard, Users, LogOut, FileText, Menu } from 'lucide-react';
import { DataProvider, useDataContext } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';

function NavLink({ href, icon, label, onClick }: { href: string; icon: ReactNode; label: string, onClick?: () => void }) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center p-3 text-sm font-medium rounded-lg w-full text-left transition-colors ${
                isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            }`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </Link>
    );
}

function MainNav({ onLogout, currentUser, onLinkClick }: { onLogout: () => void; currentUser: any; onLinkClick?: () => void; }) {
    return (
        <>
            <div className="flex items-center gap-2 p-3 mb-4">
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-headline font-bold text-primary">TMS Panel</h1>
            </div>
            <nav className="flex flex-col gap-2 flex-grow">
              <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" onClick={onLinkClick} />
              <NavLink href="/dashboard/teachers" icon={<TeacherIcon className="h-5 w-5" />} label="Teachers" onClick={onLinkClick} />
              <NavLink href="/dashboard/schools" icon={<School className="h-5 w-5" />} label="Schools & Enrollment" onClick={onLinkClick} />
              <NavLink href="/dashboard/leave" icon={<CalendarOff className="h-5 w-5" />} label="Leave Requests" onClick={onLinkClick} />
              <NavLink href="/dashboard/reports" icon={<FileText className="h-5 w-5" />} label="Reports & Data" onClick={onLinkClick} />
              {currentUser?.role !== 'Viewer' && (
                <NavLink href="/dashboard/users" icon={<Users className="h-5 w-5" />} label="Manage Users" onClick={onLinkClick} />
              )}
            </nav>
            <div className="mt-auto">
              <Button variant="outline" className="w-full justify-start text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onLogout}>
                <LogOut className="h-5 w-5 mr-3" />
                Log Out
              </Button>
            </div>
        </>
    );
}


function InnerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { currentUser, isLoading } = useDataContext();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (isLoading || !currentUser) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border p-4 hidden md:flex flex-col">
        <MainNav onLogout={handleLogout} currentUser={currentUser} />
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col">
        <header className="md:hidden flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <LayoutDashboard className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-headline font-bold text-primary">TMS Panel</h1>
            </div>
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-card p-4 flex flex-col">
                    <MainNav 
                        onLogout={handleLogout} 
                        currentUser={currentUser} 
                        onLinkClick={() => setIsMobileSheetOpen(false)} 
                    />
                </SheetContent>
            </Sheet>
        </header>
        <div className="flex-grow">
            {children}
        </div>
        <footer className="mt-8">
             <p className="text-xs text-muted-foreground text-center w-full">
                Designed and created by ITLabs Ghana © 2025, contact 0248362847
            </p>
        </footer>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DataProvider>
      <InnerLayout>{children}</InnerLayout>
    </DataProvider>
  );
}
