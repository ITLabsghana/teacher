
import TeachersTab from '@/components/dashboard/teachers-tab';
import { Suspense } from 'react';
import { getSchools, getTeachers }from '@/lib/supabase';

export default async function TeachersPage() {
    const initialTeachers = await getTeachers(0, 20, true);
    const schools = await getSchools(true);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeachersTab initialTeachers={initialTeachers} schools={schools} />
        </Suspense>
    );
}
