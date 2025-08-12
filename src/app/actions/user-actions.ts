
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

    return profile as User;
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
    return data as User;
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
        const { error: deleteAuthError } = await adminDb.auth.admin.deleteUser(user.auth_id as string);
        // We don't throw an error here if auth deletion fails,
        // as the primary record is gone. But we should log it.
        if (deleteAuthError) {
            console.error("Failed to delete auth user:", deleteAuthError.message);
        }
    }
};

export async function clearAllDataAction(): Promise<void> {
    // This action deletes all data except for admin/supervisor users.
    const { error: tError } = await adminDb.from('teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (tError) throw new Error(`Teacher Deletion Error: ${tError.message}`);

    const { error: sError } = await adminDb.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (sError) throw new Error(`School Deletion Error: ${sError.message}`);

    const { error: lError } = await adminDb.from('leave_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (lError) throw new Error(`Leave Request Deletion Error: ${lError.message}`);

    // Do not delete Admin/Supervisor users, but delete their associated auth entries if needed.
    const { data: usersToPreserve, error: usersFetchError } = await adminDb.from('users').select('id').or('role.eq.Admin,role.eq.Supervisor');
    if (usersFetchError) throw new Error(`User Fetch Error: ${usersFetchError.message}`);
    
    const userIdsToPreserve = usersToPreserve?.map(u => u.id) || [];
    
    if (userIdsToPreserve.length > 0) {
      const { error: uError } = await adminDb.from('users').delete().not('id', 'in', `(${userIdsToPreserve.join(',')})`);
      if (uError) throw new Error(`User Deletion Error: ${uError.message}`);
    } else {
      // If no admin/supervisors, delete all users.
      const { error: uError } = await adminDb.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (uError) throw new Error(`User Deletion Error: ${uError.message}`);
    }
}
