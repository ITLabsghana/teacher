
import { Suspense } from 'react';
import type { Teacher, LeaveRequest, School } from '@/lib/types';
import { Bell, User, CalendarOff, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isWithinInterval, addDays, parseISO, addYears, formatDistanceToNow, differenceInDays, isToday } from 'date-fns';
import { getTeachers, getLeaveRequests, getSchools, supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardRealtimeWrapper from '@/components/dashboard/dashboard-realtime-wrapper';
import { adminDb } from '@/lib/supabase-admin';

async function StatsCards() { 
  // Efficiently count totals directly from the database
  const { count: totalTeachers, error: teachersError } = await adminDb.from('teachers').select('*', { count: 'exact', head: true });
  const { count: maleTeachers, error: maleTeachersError } = await adminDb.from('teachers').select('*', { count: 'exact', head: true }).eq('gender', 'Male');
  const { count: femaleTeachers, error: femaleTeachersError } = await adminDb.from('teachers').select('*', { count: 'exact', head: true }).eq('gender', 'Female');

  // Efficiently get teachers on leave
  const today = new Date().toISOString();
  const { count: onLeaveCount, error: onLeaveError } = await adminDb.from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Approved')
    .lte('start_date', today)
    .gte('return_date', today);
  
  // Fetch only the specific data needed for notifications
  const tenDaysFromNow = addDays(new Date(), 10).toISOString();
  const { data: leavesEndingSoonDetails, error: leavesEndingSoonError } = await adminDb.from('leave_requests')
    .select('*, teachers(firstName, lastName)')
    .eq('status', 'Approved')
    .gte('return_date', today)
    .lte('return_date', tenDaysFromNow);

  const oneYearFromNow = addYears(new Date(), 1);
  const { data: allTeachersForRetirement, error: allTeachersError } = await adminDb.from('teachers').select('id, firstName, lastName, date_of_birth').not('date_of_birth', 'is', null);

  const nearingRetirementDetails = allTeachersForRetirement?.filter(teacher => {
      const dob = parseISO(teacher.date_of_birth!);
      const retirementDate = addYears(dob, 60);
      return retirementDate > new Date() && retirementDate <= oneYearFromNow;
    })
    .map(teacher => {
        const dob = parseISO(teacher.date_of_birth!);
        const retirementDate = addYears(dob, 60);
        return {
          name: `${teacher.firstName} ${teacher.lastName}`,
          timeToRetirement: formatDistanceToNow(retirementDate, { addSuffix: true }),
        }
    }) || [];
  
  // Fetch all schools for enrollment data - This could be optimized further with a DB function if it becomes a bottleneck
  const schools = await getSchools(true);
  
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

  const leavesEndingSoonFormatted = leavesEndingSoonDetails?.map(req => {
    const returnDateObj = parseISO(req.return_date);
    const teacher = Array.isArray(req.teachers) ? req.teachers[0] : req.teachers; // Handle one-to-one relationship
    return {
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher',
        returnDate: returnDateObj,
        daysToReturn: differenceInDays(returnDateObj, new Date()),
        isReturningToday: isToday(returnDateObj),
    };
  }) || [];


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-100 dark:bg-blue-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTeachers ?? 0}</div>
                </CardContent>
            </Card>
             <Card className="bg-green-100 dark:bg-green-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Male Teachers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{maleTeachers ?? 0}</div>
                </CardContent>
            </Card>
            <Card className="bg-pink-100 dark:bg-pink-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Female Teachers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{femaleTeachers ?? 0}</div>
                </CardContent>
            </Card>
            <Card className="bg-yellow-100 dark:bg-yellow-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Teachers on Leave</CardTitle>
                    <CalendarOff className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{onLeaveCount ?? 0}</div>
                </CardContent>
            </Card>
            <Card className="bg-orange-100 dark:bg-orange-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leaves Ending Soon</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{leavesEndingSoonFormatted.length}</div>
                    <p className="text-xs text-muted-foreground">In the next 10 days</p>
                </CardContent>
            </Card>
             <Card className="bg-purple-100 dark:bg-purple-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nearing Retirement</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{nearingRetirementDetails.length}</div>
                    <p className="text-xs text-muted-foreground">In the next year</p>
                </CardContent>
            </Card>
            
            <Card className="col-span-full border-b-4 border-primary bg-indigo-100 dark:bg-indigo-900/50">
                <CardHeader>
                    <CardTitle className="text-lg">Overall Enrollment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-indigo-200 dark:bg-indigo-800/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{grandTotalStudents}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-200 dark:bg-blue-800/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Boys</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{enrollmentTotals.total.boys}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-pink-200 dark:bg-pink-800/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Girls</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{enrollmentTotals.total.girls}</div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="col-span-1 md:col-span-3 lg:col-span-1 bg-teal-100 dark:bg-teal-900/50">
                    <CardHeader><CardTitle className="text-md">KG Enrollment</CardTitle></CardHeader>
                    <CardContent className="flex gap-4">
                        <div><p className="text-sm text-muted-foreground">Boys</p><p className="text-xl font-bold">{enrollmentTotals.kg.boys}</p></div>
                        <div><p className="text-sm text-muted-foreground">Girls</p><p className="text-xl font-bold">{enrollmentTotals.kg.girls}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">{enrollmentTotals.kg.total}</p></div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-3 lg:col-span-1 bg-sky-100 dark:bg-sky-900/50">
                    <CardHeader><CardTitle className="text-md">Primary Enrollment</CardTitle></CardHeader>
                    <CardContent className="flex gap-4">
                        <div><p className="text-sm text-muted-foreground">Boys</p><p className="text-xl font-bold">{enrollmentTotals.primary.boys}</p></div>
                        <div><p className="text-sm text-muted-foreground">Girls</p><p className="text-xl font-bold">{enrollmentTotals.primary.girls}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">{enrollmentTotals.primary.total}</p></div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-3 lg:col-span-1 bg-lime-100 dark:bg-lime-900/50">
                    <CardHeader><CardTitle className="text-md">J.H.S Enrollment</CardTitle></CardHeader>
                    <CardContent className="flex gap-4">
                        <div><p className="text-sm text-muted-foreground">Boys</p><p className="text-xl font-bold">{enrollmentTotals.jhs.boys}</p></div>
                        <div><p className="text-sm text-muted-foreground">Girls</p><p className="text-xl font-bold">{enrollmentTotals.jhs.girls}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">{enrollmentTotals.jhs.total}</p></div>
                    </CardContent>
                </Card>
            </div>
            
             <Card className="col-span-full bg-slate-100 dark:bg-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[120px] overflow-y-auto space-y-2 text-muted-foreground">
                    {leavesEndingSoonFormatted.length > 0 && leavesEndingSoonFormatted.map((leave, index) => (
                        <p key={`leave-${index}`} className="text-foreground">
                            - <strong>{leave.teacherName}</strong> returns from leave 
                            {leave.isReturningToday ? (
                                <span className="font-bold text-primary"> today</span>
                            ) : (
                                ` in ${leave.daysToReturn + 1} day(s)`
                            )}.
                        </p>
                    ))}
                    {nearingRetirementDetails.length > 0 && nearingRetirementDetails.map((retiree, index) => (
                         <p key={`retire-${index}`} className="text-foreground">
                            - <strong>{retiree.name}</strong> is due for retirement {retiree.timeToRetirement}.
                        </p>
                    ))}
                    {leavesEndingSoonFormatted.length === 0 && nearingRetirementDetails.length === 0 && (
                        <p>No new notifications.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 13 }).map((_, i) => (
                <Card key={i} className="bg-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24 bg-slate-200" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12 bg-slate-200" />
                    </CardContent>
                </Card>
            ))}
             <Card className="col-span-full bg-slate-100">
                <CardHeader>
                    <Skeleton className="h-6 w-32 bg-slate-200" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-200" />
                    <Skeleton className="h-4 w-3/4 bg-slate-200" />
                </CardContent>
            </Card>
        </div>
    );
}


export default function DashboardPage() {
    return (
        <DashboardRealtimeWrapper>
            <header className="mb-8">
                <h1 className="text-4xl font-headline font-bold text-primary">TMS Dashboard</h1>
                <p className="text-muted-foreground">An overview of your institution's data.</p>
            </header>
            <Suspense fallback={<StatsSkeleton />}>
                {/* @ts-expect-error Async Server Component */}
                <StatsCards />
            </Suspense>
        </DashboardRealtimeWrapper>
    );
}

    