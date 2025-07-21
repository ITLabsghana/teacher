
"use client";

import { useDataContext } from '@/context/data-context';
import TeachersTab from '@/components/dashboard/teachers-tab';
import { Suspense } from 'react';


export default function TeachersPage() {
    const { teachers, schools } = useDataContext();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeachersTab teachers={teachers} schools={schools} />
        </Suspense>
    );
}
