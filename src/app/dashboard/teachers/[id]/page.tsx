import { getTeacherById, getSchools, getLeaveRequests } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TeacherProfile from './teacher-profile';
import { notFound } from 'next/navigation';

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
    const teacherId = params.id;

    // Fetch data on the server using the admin client for elevated privileges
    const [teacherData, schoolsData, leaveData] = await Promise.all([
        getTeacherById(teacherId, true),
        getSchools(true),
        getLeaveRequests(true),
    ]);

    // If the teacher isn't found, render the not-found page
    if (!teacherData) {
       notFound();
    }

    // Pass server-fetched data as props to the client component
    return <TeacherProfile initialTeacher={teacherData} initialSchools={schoolsData} initialLeaveRequests={leaveData} />;
}
