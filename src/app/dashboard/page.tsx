
"use client";

import type { Teacher, LeaveRequest } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { Bell, User, CalendarOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isWithinInterval, addDays, parseISO } from 'date-fns';

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
    const { teachers, leaveRequests } = useDataContext();

    return (
        <>
            <header className="mb-8">
                <h1 className="text-4xl font-headline font-bold text-primary">Dashboard</h1>
                <p className="text-muted-foreground">An overview of your institution's data.</p>
            </header>
            <StatsCards teachers={teachers} leaveRequests={leaveRequests} />
        </>
    );
}
