
"use client";

import type { Teacher, LeaveRequest, School } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { Bell, User, CalendarOff, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isWithinInterval, addDays, parseISO, differenceInYears, addYears } from 'date-fns';

function StatsCards({ teachers, leaveRequests, schools }: { teachers: Teacher[], leaveRequests: LeaveRequest[], schools: School[] }) {
    const onLeaveCount = leaveRequests.filter(req => req.status === 'Approved').length;
    const leavesEndingSoon = leaveRequests.filter(req => {
        if (req.status !== 'Approved') return false;
        const returnDate = typeof req.returnDate === 'string' ? parseISO(req.returnDate) : req.returnDate;
        return isWithinInterval(returnDate, {
            start: new Date(),
            end: addDays(new Date(), 7)
        });
    }).length;

    const nearingRetirementCount = teachers.filter(teacher => {
        if (!teacher.dateOfBirth) return false;
        const dob = typeof teacher.dateOfBirth === 'string' ? parseISO(teacher.dateOfBirth) : teacher.dateOfBirth;
        const age = differenceInYears(new Date(), dob);
        const nextYear = addYears(new Date(), 1);
        const ageInOneYear = differenceInYears(nextYear, dob);
        return age < 60 && ageInOneYear >= 60;
    }).length;

    const enrollmentTotals = schools.reduce((acc, school) => {
        if (school.enrollment) {
            Object.values(school.enrollment).forEach(classData => {
                acc.boys += classData.boys || 0;
                acc.girls += classData.girls || 0;
            });
        }
        return acc;
    }, { boys: 0, girls: 0 });

    const grandTotalStudents = enrollmentTotals.boys + enrollmentTotals.girls;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{grandTotalStudents}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Boys</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{enrollmentTotals.boys}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Girls</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{enrollmentTotals.girls}</div>
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
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nearing Retirement</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{nearingRetirementCount}</div>
                    <p className="text-xs text-muted-foreground">In the next year</p>
                </CardContent>
            </Card>
             <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[80px] overflow-y-auto space-y-2">
                    {leavesEndingSoon > 0 && (
                         <p className="text-xs text-muted-foreground">
                            - {leavesEndingSoon} teacher(s) returning from leave soon.
                        </p>
                    )}
                     {nearingRetirementCount > 0 && (
                         <p className="text-xs text-muted-foreground">
                            - {nearingRetirementCount} teacher(s) nearing retirement age.
                        </p>
                    )}
                    {leavesEndingSoon === 0 && nearingRetirementCount === 0 && (
                        <p className="text-xs text-muted-foreground">No new notifications.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
    const { teachers, leaveRequests, schools } = useDataContext();

    return (
        <>
            <header className="mb-8">
                <h1 className="text-4xl font-headline font-bold text-primary">Dashboard</h1>
                <p className="text-muted-foreground">An overview of your institution's data.</p>
            </header>
            <StatsCards teachers={teachers} leaveRequests={leaveRequests} schools={schools} />
        </>
    );
}
