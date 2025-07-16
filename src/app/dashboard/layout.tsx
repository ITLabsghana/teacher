"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { School, User as TeacherIcon, CalendarOff, LayoutDashboard, Users, LogOut, PenSquare } from 'lucide-react';
import { DataProvider, useDataContext } from '@/context/data-context';
import { Button } from '@/components/ui/button';

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');


    return (
        <Link
            href={href}
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

function InnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, setCurrentUser, isLoading } = useDataContext();

  useEffect(() => {
    // If there's no logged-in user and data has finished loading, redirect to login page.
    if (!isLoading && !currentUser) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/');
  };

  if (isLoading || !currentUser) {
    // Render a loading state or null while we wait for the data or redirect
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 p-3 mb-4">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-headline font-bold text-primary">Admin Panel</h1>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" />
          <NavLink href="/dashboard/teachers" icon={<TeacherIcon className="h-5 w-5" />} label="Teachers" />
          <NavLink href="/dashboard/schools" icon={<School className="h-5 w-5" />} label="Schools & Enrollment" />
          <NavLink href="/dashboard/leave" icon={<CalendarOff className="h-5 w-5" />} label="Leave Requests" />
          {currentUser.role !== 'Viewer' && (
            <NavLink href="/dashboard/users" icon={<Users className="h-5 w-5" />} label="Manage Users" />
          )}
        </nav>
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-secondary hover:text-secondary-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            Log Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DataProvider>
      <InnerLayout>{children}</InnerLayout>
    </DataProvider>
  );
}
