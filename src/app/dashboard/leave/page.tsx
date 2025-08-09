
import LeaveTab from '@/components/dashboard/leave-tab';
import { getLeaveRequests, getTeachers } from '@/lib/supabase';

export default async function LeavePage() {
    const [initialLeaveRequests, initialTeachers] = await Promise.all([
        getLeaveRequests(true),
        getTeachers(0, 10000, true),
    ]);

    return (
        <LeaveTab
            initialLeaveRequests={initialLeaveRequests}
            initialTeachers={initialTeachers}
            isLoading={false}
        />
    );
}
