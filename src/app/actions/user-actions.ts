
'use server';

import { adminDb } from '@/lib/supabase-admin';
import type { User } from '@/lib/types';

export async function createUserAction(user: Omit<User, 'id'>): Promise<User> {
    // Step 1: Create the authentication user in Supabase Auth
    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
        email: user.email,
        password: user.password!,
        email_confirm: true, // Set to true to avoid sending confirmation emails
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

    const { data: profile, error: profileError } = await adminDb
        .from('users')
        .insert([profileData])
        .select()
        .single();

    if (profileError) {
        // If profile creation fails, we should ideally delete the auth user to avoid orphans
        await adminDb.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile Error: ${profileError.message}`);
    }

    return profile;
};

export async function updateUserAction(user: User): Promise<User> {
    const { password, ...updateData } = user;
    
    // If password is provided, update it in Supabase Auth
    if (password && user.auth_id) {
        const { error: authError } = await adminDb.auth.admin.updateUserById(user.auth_id, { password });
        if (authError) {
            throw new Error(`Auth Update Error: ${authError.message}`);
        }
    }

    // Update the user profile in the public 'users' table
    const { data, error } = await adminDb.from('users').update(updateData).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
};

export async function deleteUserAction(id: string): Promise<void> {
    // First, get the user's auth_id from our public table
    const { data: user, error: fetchError } = await adminDb.from('users').select('auth_id').eq('id', id).single();
    if (fetchError) throw new Error(`Failed to fetch user for deletion: ${fetchError.message}`);
    if (!user) throw new Error("User not found.");

    // Then, delete from the public users table
    const { error: deleteProfileError } = await adminDb.from('users').delete().eq('id', id);
    if (deleteProfileError) throw deleteProfileError;

    // Finally, delete the user from Supabase Auth
    if (user.auth_id) {
        const { error: deleteAuthError } = await adminDb.auth.admin.deleteUser(user.auth_id);
        // We don't throw an error here if auth deletion fails,
        // as the primary record is gone. But we should log it.
        if (deleteAuthError) {
            console.error("Failed to delete auth user:", deleteAuthError.message);
        }
    }
};


