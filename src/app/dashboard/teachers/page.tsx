
"use client";

import TeachersTab from '@/components/dashboard/teachers-tab';
import { Suspense } from 'react';

export default function TeachersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TeachersTab />
        </Suspense>
    );
}
