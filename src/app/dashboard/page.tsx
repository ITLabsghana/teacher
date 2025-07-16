"use client";

import { useState } from 'react';
import type { Teacher, School, LeaveRequest } from '@/lib/types';
import { Bell, User, School as SchoolIcon, CalendarOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import TeachersTab from '@/components/dashboard/teachers-tab';
import SchoolsTab from '@/components/dashboard/schools-tab';
import LeaveTab from '@/components/dashboard/leave-tab';
import { isWithinInterval, addDays, parseISO } from 'date-fns';

type View = 'teachers' | 'schools' | 'leave';

function StatsCards({ teachers, leaveRequests }: { teachers: Teacher[], leaveRequests: LeaveRequest[] }) {
    const onLeaveCount = leaveRequests.filter(req => req.status === 'Approved').length;
    const leavesEndingSoon = leaveRequests.filter(req => {
        if (req.status !== 'Approved') return false;
        const returnDate = typeof req.returnDate === 'string' ? parseISO(req.returnDate) : req.returnDate;
        return isWithinInterval(returnDate, {
            start: new Date(),
            end: addDays(new Date(), 7)
        });
    }).length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{teachers.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Teachers on Leave</CardTitle>
                    <CalendarOff className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{onLeaveCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leaves Ending Soon</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{leavesEndingSoon}</div>
                    <p className="text-xs text-muted-foreground">In the next 7 days</p>
                </CardContent>
            </Card>
             <Card className="col-span-1 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[80px] overflow-y-auto">
                    {leavesEndingSoon > 0 ? (
                         <p className="text-xs text-muted-foreground">
                            {leavesEndingSoon} teacher(s) returning from leave soon.
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">No new notifications.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
    const [activeView, setActiveView] = useState<View>('teachers');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

    const renderContent = () => {
        switch (activeView) {
            case 'teachers':
                return <TeachersTab teachers={teachers} setTeachers={setTeachers} schools={schools} />;
            case 'schools':
                return <SchoolsTab schools={schools} setSchools={setSchools} />;
            case 'leave':
                return <LeaveTab leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} teachers={teachers} />;
            default:
                return null;
        }
    };

    const NavLink = ({ view, icon, label }: { view: View, icon: React.ReactNode, label: string }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center p-3 text-sm font-medium rounded-lg w-full text-left transition-colors ${
                activeView === view
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            }`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-background">
            <aside className="w-64 bg-card border-r border-border p-4 hidden md:flex flex-col">
                <div className="flex items-center gap-2 p-3 mb-4">
                     <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <SchoolIcon className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-headline font-bold text-primary">Admin Panel</h1>
                </div>
                <nav className="flex flex-col gap-2">
                    <NavLink view="teachers" icon={<User className="h-5 w-5" />} label="Teachers" />
                    <NavLink view="schools" icon={<SchoolIcon className="h-5 w-5" />} label="Schools" />
                    <NavLink view="leave" icon={<CalendarOff className="h-5 w-5" />} label="Leave Requests" />
                </nav>
            </aside>
            <main className="flex-1 p-4 md:p-8">
                 <header className="mb-8">
                    <h1 className="text-4xl font-headline font-bold text-primary">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your institution's data from one place.</p>
                </header>
                <StatsCards teachers={teachers} leaveRequests={leaveRequests} />
                <div className="mt-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
