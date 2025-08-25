'use server';

import { adminDb } from '@/lib/supabase-admin';
import { parseTeacherDates } from '@/lib/supabase';
import type { Teacher } from '@/lib/types';

export async function searchTeachers(searchTerm: string): Promise<Teacher[]> {
    if (!searchTerm) {
        return [];
    }

    const { data, error } = await adminDb
        .from('teachers')
        .select('*')
        .or(`firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%,staffId.ilike.%${searchTerm}%`)
        .limit(20);

    if (error) {
        console.error('Search Error:', error);
        return [];
    }

    return data.map(parseTeacherDates);
}


import { addTeacher, updateTeacher, deleteTeacher } from '@/lib/supabase';

export async function deleteTeacherAction(teacherId: string): Promise<void> {
    try {
        await deleteTeacher(teacherId);
    } catch (error: any) {
        console.error("Error in deleteTeacherAction:", error.message);
        throw new Error(`Failed to delete teacher: ${error.message}`);
    }
}

export async function addTeacherAction(teacherData: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> {
    try {
        const newTeacher = await addTeacher(teacherData);
        return newTeacher;
    } catch (error: any) {
        console.error("Error in addTeacherAction:", error);
        // Re-throw the error to be caught by the form
        throw new Error(`Failed to add teacher: ${error.message}`);
    }
}

export async function updateTeacherAction(teacher: Teacher): Promise<Teacher> {
    console.log("--- [Server Action] updateTeacherAction ---");
    console.log("Checking for SUPABASE_SERVICE_ROLE_KEY presence:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    try {
        const updatedTeacher = await updateTeacher(teacher);
        console.log("updateTeacherAction successful for teacher ID:", teacher.id);
        return updatedTeacher;
    } catch (error: any) {
        console.error("Error in updateTeacherAction:", error.message);
        throw new Error(`Failed to update teacher: ${error.message}`);
    }
}
