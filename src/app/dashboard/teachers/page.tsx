
"use client";

import TeachersTab from '@/components/dashboard/teachers-tab';
import { Suspense } from 'react';
import { getSchools, getTeachers }from '@/lib/supabase';
import type { Teacher, School } from '@/lib/types';


export default async function TeachersPage() {
    const initialTeachers = await getTeachers(0, 20);
    const schools = await getSchools();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeachersTab initialTeachers={initialTeachers} schools={schools} />
        </Suspense>
    );
}
