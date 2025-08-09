
import TeachersTab from '@/components/dashboard/teachers-tab';
import { getTeachers, getSchools, getLeaveRequests } from '@/lib/supabase';

export default async function TeachersPage() {
    const [initialTeachers, initialSchools] = await Promise.all([
        getTeachers(0, 20, true),
        getSchools(true),
    ]);

    return (
        <TeachersTab
            initialTeachers={initialTeachers}
            initialSchools={initialSchools}
            initialLeaveRequests={[]}
        />
    );
}
