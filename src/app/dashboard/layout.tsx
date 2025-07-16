
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { School, User, CalendarOff, GanttChartSquare } from 'lucide-react';

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 p-3 mb-4">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <GanttChartSquare className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-headline font-bold text-primary">Admin Panel</h1>
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink href="/dashboard" icon={<User className="h-5 w-5" />} label="Dashboard" />
          <NavLink href="/dashboard/teachers" icon={<User className="h-5 w-5" />} label="Teachers" />
          <NavLink href="/dashboard/schools" icon={<School className="h-5 w-5" />} label="Schools" />
          <NavLink href="/dashboard/leave" icon={<CalendarOff className="h-5 w-5" />} label="Leave Requests" />
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
