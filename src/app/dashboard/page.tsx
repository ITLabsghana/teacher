
"use client";

import type { Teacher, LeaveRequest, School } from '@/lib/types';
import { Bell, User, CalendarOff, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isWithinInterval, addDays, parseISO, addYears, formatDistanceToNow, differenceInDays, isToday } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { getTeachers, getLeaveRequests, getSchools, supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

function StatsCards({ 
  teachers, 
  leaveRequests, 
  schools,
  isLoading 
}: { 
  teachers: Teacher[], 
  leaveRequests: LeaveRequest[], 
  schools: School[],
  isLoading: boolean
}) {
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
        
        const enrollmentTotals = {
            total: { boys: 0, girls: 0 },
            kg: { boys: 0, girls: 0, total: 0 },
            primary: { boys: 0, girls: 0, total: 0 },
            jhs: { boys: 0, girls: 0, total: 0 },
        };

        schools.forEach(school => {
            if (school.enrollment) {
                Object.entries(school.enrollment).forEach(([classLevel, classData]) => {
                    const boys = classData.boys || 0;
                    const girls = classData.girls || 0;

                    enrollmentTotals.total.boys += boys;
                    enrollmentTotals.total.girls += girls;

                    if (classLevel.startsWith('KG')) {
                        enrollmentTotals.kg.boys += boys;
                        enrollmentTotals.kg.girls += girls;
                    } else if (classLevel.startsWith('Basic')) {
                        enrollmentTotals.primary.boys += boys;
                        enrollmentTotals.primary.girls += girls;
                    } else if (classLevel.startsWith('JHS')) {
                        enrollmentTotals.jhs.boys += boys;
                        enrollmentTotals.jhs.girls += girls;
                    }
                });
            }
        });
        
        enrollmentTotals.kg.total = enrollmentTotals.kg.boys + enrollmentTotals.kg.girls;
        enrollmentTotals.primary.total = enrollmentTotals.primary.boys + enrollmentTotals.primary.girls;
        enrollmentTotals.jhs.total = enrollmentTotals.jhs.boys + enrollmentTotals.jhs.girls;
        const grandTotalStudents = enrollmentTotals.total.boys + enrollmentTotals.total.girls;

        const maleTeachers = teachers.filter(t => t.gender === 'Male').length;
        const femaleTeachers = teachers.filter(t => t.gender === 'Female').length;

        return { 
            onLeaveCount, 
            leavesEndingSoon: leavesEndingSoonDetails.length, 
            nearingRetirementCount: nearingRetirementDetails.length, 
            enrollmentTotals, 
            grandTotalStudents,
            leavesEndingSoonDetails,
            nearingRetirementDetails,
            maleTeachers,
            femaleTeachers,
        };
    }, [teachers, leaveRequests, schools]);

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 13 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
                 <Card className="col-span-full">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <CardTitle className="text-sm font-medium">Male Teachers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.maleTeachers}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Female Teachers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.femaleTeachers}</div>
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
            
            <Card className="col-span-full border-b-4 border-primary">
                <CardHeader>
                    <CardTitle className="text-lg">Overall Enrollment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <div className="text-2xl font-bold">{stats.enrollmentTotals.total.boys}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Girls</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.enrollmentTotals.total.girls}</div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="col-span-1 md:col-span-3 lg:col-span-1">
                    <CardHeader><CardTitle className="text-md">KG Enrollment</CardTitle></CardHeader>
                    <CardContent className="flex gap-4">
                        <div><p className="text-sm text-muted-foreground">Boys</p><p className="text-xl font-bold">{stats.enrollmentTotals.kg.boys}</p></div>
                        <div><p className="text-sm text-muted-foreground">Girls</p><p className="text-xl font-bold">{stats.enrollmentTotals.kg.girls}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.enrollmentTotals.kg.total}</p></div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-3 lg:col-span-1">
                    <CardHeader><CardTitle className="text-md">Primary Enrollment</CardTitle></CardHeader>
                    <CardContent className="flex gap-4">
                        <div><p className="text-sm text-muted-foreground">Boys</p><p className="text-xl font-bold">{stats.enrollmentTotals.primary.boys}</p></div>
                        <div><p className="text-sm text-muted-foreground">Girls</p><p className="text-xl font-bold">{stats.enrollmentTotals.primary.girls}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.enrollmentTotals.primary.total}</p></div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-3 lg:col-span-1">
                    <CardHeader><CardTitle className="text-md">J.H.S Enrollment</CardTitle></CardHeader>
                    <CardContent className="flex gap-4">
                        <div><p className="text-sm text-muted-foreground">Boys</p><p className="text-xl font-bold">{stats.enrollmentTotals.jhs.boys}</p></div>
                        <div><p className="text-sm text-muted-foreground">Girls</p><p className="text-xl font-bold">{stats.enrollmentTotals.jhs.girls}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.enrollmentTotals.jhs.total}</p></div>
                    </CardContent>
                </Card>
            </div>
            
             <Card className="col-span-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[120px] overflow-y-auto space-y-2 text-muted-foreground">
                    {stats.leavesEndingSoonDetails.length > 0 && stats.leavesEndingSoonDetails.map((leave, index) => (
                        <p key={`leave-${index}`} className="text-foreground">
                            - <strong>{leave.teacherName}</strong> returns from leave 
                            {leave.isReturningToday ? (
                                <span className="font-bold text-primary"> today</span>
                            ) : (
                                ` in ${leave.daysToReturn + 1} day(s)`
                            )}.
                        </p>
                    ))}
                    {stats.nearingRetirementDetails.length > 0 && stats.nearingRetirementDetails.map((retiree, index) => (
                         <p key={`retire-${index}`} className="text-foreground">
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
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [teacherData, leaveData, schoolData] = await Promise.all([
                getTeachers(0, 1000), // Fetch a large number for dashboard stats
                getLeaveRequests(),
                getSchools()
            ]);
            setTeachers(teacherData);
            setLeaveRequests(leaveData);
            setSchools(schoolData);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDashboardData();

        const channel = supabase
          .channel('dashboard-realtime-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => fetchDashboardData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => fetchDashboardData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => fetchDashboardData())
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }, []);

    return (
        <>
            <header className="mb-8">
                <h1 className="text-4xl font-headline font-bold text-primary">TMS Dashboard</h1>
                <p className="text-muted-foreground">An overview of your institution's data.</p>
            </header>
            <StatsCards 
                teachers={teachers} 
                leaveRequests={leaveRequests} 
                schools={schools} 
                isLoading={isLoading} 
            />
        </>
    );
}
