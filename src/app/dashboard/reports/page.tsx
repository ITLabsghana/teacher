
import { Suspense } from 'react';
import ReportsTab from '@/components/dashboard/reports-tab';
import { getTeachers, getSchools, getLeaveRequests, getUsers } from '@/lib/supabase';

export default async function ReportsPage() {
  const [teachers, schools, leaveRequests, users] = await Promise.all([
    getTeachers(0, 10000, true),
    getSchools(true),
    getLeaveRequests(true),
    getUsers(true)
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsTab
        initialTeachers={teachers}
        initialSchools={schools}
        initialLeaveRequests={leaveRequests}
        initialUsers={users}
      />
    </Suspense>
  );
}
