
import LeaveTab from '@/components/dashboard/leave-tab';
import { getLeaveRequests, getTeachers } from '@/lib/supabase';

export default async function LeavePage() {
    const initialLeaveRequests = await getLeaveRequests(true);

    return (
        <LeaveTab
            initialLeaveRequests={initialLeaveRequests}
            initialTeachers={[]}
            isLoading={false}
        />
    );
}
