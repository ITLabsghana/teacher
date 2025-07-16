"use client";

import { useState } from 'react';
import type { Teacher, School } from '@/lib/types';
import TeachersTab from '@/components/dashboard/teachers-tab';

// Mock data, in a real app this would come from a data store or API
const initialTeachers: Teacher[] = [];
const initialSchools: School[] = [];


export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
    const [schools] = useState<School[]>(initialSchools);

    return (
        <TeachersTab teachers={teachers} setTeachers={setTeachers} schools={schools} />
    );
}
