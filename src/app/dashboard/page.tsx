
"use client";

import type { Teacher, LeaveRequest, School } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { Bell, User, CalendarOff, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isWithinInterval, addDays, parseISO, addYears, formatDistanceToNow, format, differenceInDays, isToday } from 'date-fns';
import { useMemo } from 'react';

function StatsCards({ teachers, leaveRequests, schools }: { teachers: Teacher[], leaveRequests: LeaveRequest[], schools: School[] }) {
    const stats = useMemo(() => {
        const onLeaveCount = leaveRequests.filter(req => req.status === 'Approved').length;

        const getTeacherName = (teacherId: string) => {
            const teacher = teachers.find(t => t.id === teacherId);
            return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher';
        };

        const leavesEndingSoonDetails = leaveRequests
            .filter(req => {
                if (req.status !== 'Approved' || !req.returnDate) return false;
                const returnDate = typeof req.returnDate === 'string' ? parseISO(req.returnDate) : req.returnDate;
                // Show notifications for teachers returning in the next 10 days
                return isWithinInterval(returnDate, {
                    start: new Date(),
                    end: addDays(new Date(), 10)
                });
            })
            .map(req => {
                const returnDateObj = typeof req.returnDate === 'string' ? parseISO(req.returnDate) : req.returnDate;
                return {
                    teacherName: getTeacherName(req.teacherId),
                    returnDate: returnDateObj,
                    daysToReturn: differenceInDays(returnDateObj, new Date()),
                    isReturningToday: isToday(returnDateObj),
                };
            });

        const nearingRetirementDetails = teachers
            .filter(teacher => {
                if (!teacher.dateOfBirth) return false;
                const dob = typeof teacher.dateOfBirth === 'string' ? parseISO(teacher.dateOfBirth) : teacher.dateOfBirth;
                const retirementDate = addYears(dob, 60);
                // Show notifications for teachers retiring in the next 12 months (1 year)
                const nextYear = addYears(new Date(), 1);
                return retirementDate > new Date() && retirementDate <= nextYear;
            })
            .map(teacher => {
                 const dob = typeof teacher.dateOfBirth === 'string' ? parseISO(teacher.dateOfBirth!) : teacher.dateOfBirth!;
                 const retirementDate = addYears(dob, 60);
                 return {
                    name: `${teacher.firstName} ${teacher.lastName}`,
                    timeToRetirement: formatDistanceToNow(retirementDate, { addSuffix: true }),
                 }
            });

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

        return { 
            onLeaveCount, 
            leavesEndingSoon: leavesEndingSoonDetails.length, 
            nearingRetirementCount: nearingRetirementDetails.length, 
            enrollmentTotals, 
            grandTotalStudents,
            leavesEndingSoonDetails,
            nearingRetirementDetails,
        };
    }, [teachers, leaveRequests, schools]);

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
                    <div className="text-2xl font-bold">{stats.onLeaveCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.grandTotalStudents}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Boys</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.enrollmentTotals.boys}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Girls</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.enrollmentTotals.girls}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leaves Ending Soon</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.leavesEndingSoon}</div>
                    <p className="text-xs text-muted-foreground">In the next 10 days</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nearing Retirement</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.nearingRetirementCount}</div>
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
                <CardContent className="h-[80px] overflow-y-auto space-y-2 text-muted-foreground">
                    {stats.leavesEndingSoonDetails.length > 0 && stats.leavesEndingSoonDetails.map((leave, index) => (
                        <p key={`leave-${index}`}>
                            - <strong>{leave.teacherName}</strong> returns from leave 
                            {leave.isReturningToday ? (
                                <span className="font-bold text-primary"> today</span>
                            ) : (
                                ` in ${leave.daysToReturn + 1} day(s)`
                            )}.
                        </p>
                    ))}
                    {stats.nearingRetirementDetails.length > 0 && stats.nearingRetirementDetails.map((retiree, index) => (
                         <p key={`retire-${index}`}>
                            - <strong>{retiree.name}</strong> is due for retirement {retiree.timeToRetirement}.
                        </p>
                    ))}
                    {stats.leavesEndingSoon === 0 && stats.nearingRetirementCount === 0 && (
                        <p>No new notifications.</p>
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
                <h1 className="text-4xl font-headline font-bold text-primary">TMS Dashboard</h1>
                <p className="text-muted-foreground">An overview of your institution's data.</p>
            </header>
            <StatsCards teachers={teachers} leaveRequests={leaveRequests} schools={schools} />
        </>
    );
}
