
"use client";

import { useDataContext } from '@/context/data-context';
import TeachersTab from '@/components/dashboard/teachers-tab';


export default function TeachersPage() {
    const { teachers, setTeachers, schools } = useDataContext();

    return (
        <TeachersTab teachers={teachers} setTeachers={setTeachers} schools={schools} />
    );
}
