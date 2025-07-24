import { createClient } from '@supabase/supabase-js';
import type { Teacher, School, LeaveRequest, User } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getTeachers = async (): Promise<Teacher[]> => {
    const { data, error } = await supabase.from('teachers').select('*');
    if (error) throw error;
    return data.map(t => {
        let documents = t.documents;
        // The 'documents' field is stored as JSONB but can be returned as a string.
        // We need to parse it back into an array for the application to use.
        if (typeof documents === 'string') {
            try {
                documents = JSON.parse(documents);
            } catch (e) {
                console.error("Failed to parse documents JSON:", e);
                documents = []; // Default to empty array on parsing error
            }
        }
        return {
            ...t,
            documents: documents || [], // Ensure documents is always an array
            dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : undefined, 
            firstAppointmentDate: t.firstAppointmentDate ? new Date(t.firstAppointmentDate) : undefined, 
            lastPromotionDate: t.lastPromotionDate ? new Date(t.lastPromotionDate) : undefined, 
            datePostedToCurrentSchool: t.datePostedToCurrentSchool ? new Date(t.datePostedToCurrentSchool) : undefined, 
            dateConfirmed: t.dateConfirmed ? new Date(t.dateConfirmed) : undefined 
        };
    }) || [];
};

export const getSchools = async (): Promise<School[]> => {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) throw error;
    return data || [];
};

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase.from('leave_requests').select('*');
    if (error) throw error;
    return data.map(r => ({ ...r, startDate: new Date(r.startDate), returnDate: new Date(r.returnDate)})) || [];
};

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
    }
    return data;
}

export const addTeacher = async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
    const teacherData = {
        ...teacher,
        documents: teacher.documents && teacher.documents.length > 0 ? JSON.stringify(teacher.documents) : null,
    };
    const { data, error } = await supabase.from('teachers').insert([teacherData]).select().single();
    if (error) throw error;
    return data;
};

export const updateTeacher = async (teacher: Teacher): Promise<Teacher> => {
    const teacherData = {
        ...teacher,
        documents: teacher.documents && teacher.documents.length > 0 ? JSON.stringify(teacher.documents) : null,
    };
    const { data, error } = await supabase.from('teachers').update(teacherData).eq('id', teacher.id).select().single();
    if (error) throw error;
    return data;
};

export const deleteTeacher = async (id: string): Promise<void> => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
};

export const addSchool = async (school: Omit<School, 'id'>): Promise<School> => {
    const { data, error } = await supabase.from('schools').insert([school]).select().single();
    if (error) throw error;
    return data;
};

export const updateSchool = async (school: School): Promise<School> => {
    const { data, error } = await supabase.from('schools').update(school).eq('id', school.id).select().single();
    if (error) throw error;
    return data;
};

export const deleteSchool = async (id: string): Promise<void> => {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) throw error;
};

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    const newRequest = { ...request, status: 'Pending' };
    const { data, error } = await supabase.from('leave_requests').insert([newRequest]).select().single();
    if (error) throw error;
    return { ...data, startDate: new Date(data.startDate), returnDate: new Date(data.returnDate)};
};

export const updateLeaveRequest = async (request: LeaveRequest): Promise<LeaveRequest> => {
    const { data, error } = await supabase.from('leave_requests').update(request).eq('id', request.id).select().single();
    if (error) throw error;
    return { ...data, startDate: new Date(data.startDate), returnDate: new Date(data.returnDate)};
};
