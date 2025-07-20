import { createClient } from '@supabase/supabase-js';
import type { Teacher, School, LeaveRequest, User } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getTeachers = async (): Promise<Teacher[]> => {
    const { data, error } = await supabase.from('teachers').select('*');
    if (error) throw error;
    return data.map(t => ({...t, dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : undefined, firstAppointmentDate: t.firstAppointmentDate ? new Date(t.firstAppointmentDate) : undefined, lastPromotionDate: t.lastPromotionDate ? new Date(t.lastPromotionDate) : undefined, datePostedToCurrentSchool: t.datePostedToCurrentSchool ? new Date(t.datePostedToCurrentSchool) : undefined, dateConfirmed: t.dateConfirmed ? new Date(t.dateConfirmed) : undefined })) || [];
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
    const { data, error } = await supabase.from('teachers').insert([teacher]).select();
    if (error) throw error;
    return data[0];
};

export const updateTeacher = async (teacher: Teacher): Promise<Teacher> => {
    const { data, error } = await supabase.from('teachers').update(teacher).eq('id', teacher.id).select();
    if (error) throw error;
    return data[0];
};

export const deleteTeacher = async (id: string): Promise<void> => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
};

export const addSchool = async (school: Omit<School, 'id'>): Promise<School> => {
    const { data, error } = await supabase.from('schools').insert([school]).select();
    if (error) throw error;
    return data[0];
};

export const updateSchool = async (school: School): Promise<School> => {
    const { data, error } = await supabase.from('schools').update(school).eq('id', school.id).select();
    if (error) throw error;
    return data[0];
};

export const deleteSchool = async (id: string): Promise<void> => {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) throw error;
};

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    const newRequest = { ...request, status: 'Pending' };
    const { data, error } = await supabase.from('leave_requests').insert([newRequest]).select();
    if (error) throw error;
    return { ...data[0], startDate: new Date(data[0].startDate), returnDate: new Date(data[0].returnDate)};
};

export const updateLeaveRequest = async (request: LeaveRequest): Promise<LeaveRequest> => {
    const { data, error } = await supabase.from('leave_requests').update(request).eq('id', request.id).select();
    if (error) throw error;
    return { ...data[0], startDate: new Date(data[0].startDate), returnDate: new Date(data[0].returnDate)};
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    // Step 1: Create the authentication user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password!,
    });

    if (authError) {
        throw new Error(`Auth Error: ${authError.message}`);
    }

    if (!authData.user) {
        throw new Error("Could not create authentication user.");
    }

    // Step 2: Create the user profile in the public 'users' table
    const profileData = {
        auth_id: authData.user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

    if (profileError) {
        // If profile creation fails, we should ideally delete the auth user to avoid orphans
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile Error: ${profileError.message}`);
    }

    return profile;
};

export const updateUser = async (user: User): Promise<User> => {
    const { password, ...updateData } = user;
    
    // If password is provided, update it in Supabase Auth
    if (password && user.auth_id) {
        const { error: authError } = await supabase.auth.admin.updateUserById(user.auth_id, { password });
        if (authError) {
            throw new Error(`Auth Update Error: ${authError.message}`);
        }
    }

    // Update the user profile in the public 'users' table
    const { data, error } = await supabase.from('users').update(updateData).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
};

export const deleteUser = async (id: string): Promise<void> => {
    // First, get the user's auth_id from our public table
    const { data: user, error: fetchError } = await supabase.from('users').select('auth_id').eq('id', id).single();
    if (fetchError) throw new Error(`Failed to fetch user for deletion: ${fetchError.message}`);
    if (!user) throw new Error("User not found.");

    // Then, delete from the public users table
    const { error: deleteProfileError } = await supabase.from('users').delete().eq('id', id);
    if (deleteProfileError) throw deleteProfileError;

    // Finally, delete the user from Supabase Auth
    if (user.auth_id) {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.auth_id);
        // We don't throw an error here if auth deletion fails,
        // as the primary record is gone. But we should log it.
        if (deleteAuthError) {
            console.error("Failed to delete auth user:", deleteAuthError.message);
        }
    }
};
