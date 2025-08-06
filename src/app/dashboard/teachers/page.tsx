
import TeachersTab from '@/components/dashboard/teachers-tab';
import { Suspense } from 'react';
import { getTeachers }from '@/lib/supabase';

export default async function TeachersPage() {
    const initialTeachers = await getTeachers(0, 20, true);
    
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeachersTab initialTeachers={initialTeachers} />
        </Suspense>
    );
}
