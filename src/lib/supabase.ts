
import { createClient } from '@supabase/supabase-js';
import type { Teacher, School, LeaveRequest, User } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const parseTeacherDates = (teacher: any): Teacher => ({
    ...teacher,
    documents: teacher.documents ? (typeof teacher.documents === 'string' ? JSON.parse(teacher.documents) : teacher.documents) : [],
    dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth) : undefined,
    firstAppointmentDate: teacher.firstAppointmentDate ? new Date(teacher.firstAppointmentDate) : undefined,
    lastPromotionDate: teacher.lastPromotionDate ? new Date(teacher.lastPromotionDate) : undefined,
    datePostedToCurrentSchool: teacher.datePostedToCurrentSchool ? new Date(teacher.datePostedToCurrentSchool) : undefined,
    dateConfirmed: teacher.dateConfirmed ? new Date(teacher.dateConfirmed) : undefined,
});

// --- Data Fetching ---

export const getTeachers = async (page: number = 0, limit: number = 20): Promise<Teacher[]> => {
    const from = page * limit;
    const to = from + limit - 1;
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('firstName', { ascending: true })
        .range(from, to);
        
    if (error) throw error;
    return data.map(parseTeacherDates) || [];
};

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
    const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single();
    if (error) {
        // PGRST116: "single row not found" - this is expected, not an error.
        if (error.code !== 'PGRST116') {
            console.error("Error fetching teacher by id", error);
        }
        return null;
    }
    return parseTeacherDates(data);
}

export const getSchools = async (): Promise<School[]> => {
    const { data, error } = await supabase.from('schools').select('*').order('name');
    if (error) throw error;
    return data || [];
};

export const getSchoolById = async (id: string): Promise<School | null> => {
    const { data, error } = await supabase.from('schools').select('*').eq('id', id).single();
    if (error) {
        if (error.code !== 'PGRST116') {
          console.error("Error fetching school by id", error);
        }
        return null;
    }
    return data;
}

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase.from('leave_requests').select('*').order('startDate', { ascending: false });
    if (error) throw error;
    return data.map(r => ({ ...r, startDate: new Date(r.startDate), returnDate: new Date(r.returnDate)})) || [];
};

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('username');
    if (error) throw error;
    return data || [];
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// --- Data Mutation ---

const prepareTeacherForDb = (teacher: Partial<Teacher>) => {
    const dbData: { [key: string]: any } = { ...teacher };
    
    // Convert empty strings back to null for the database
    Object.keys(dbData).forEach(key => {
        if (dbData[key] === '' || dbData[key] === undefined) {
            dbData[key] = null;
        }
    });

    if (Array.isArray(dbData.documents)) {
        dbData.documents = JSON.stringify(dbData.documents);
    } else if (dbData.documents === null) {
        dbData.documents = JSON.stringify([]);
    }
    
    return dbData;
};

export const addTeacher = async (teacher: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> => {
    const teacherData = prepareTeacherForDb(teacher);
    const { data, error } = await supabase.from('teachers').insert([teacherData]).select().single();
    if (error) throw error;
    return parseTeacherDates(data);
};

export const updateTeacher = async (teacher: Teacher): Promise<Teacher> => {
    const dbData = prepareTeacherForDb(teacher);
    const { data, error } = await supabase.from('teachers').update(dbData).eq('id', teacher.id).select().single();
    
    if (error) {
        throw error;
    }
    
    return parseTeacherDates(data);
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
    const newRequest = { ...request, status: 'Pending' as const };
    const { data, error } = await supabase.from('leave_requests').insert([newRequest]).select().single();
    if (error) throw error;
    return { ...data, startDate: new Date(data.startDate), returnDate: new Date(data.returnDate)};
};

export const updateLeaveRequest = async (request: LeaveRequest): Promise<LeaveRequest> => {
    const { data, error } = await supabase.from('leave_requests').update(request).eq('id', request.id).select().single();
    if (error) throw error;
    return { ...data, startDate: new Date(data.startDate), returnDate: new Date(data.returnDate)};
};
