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
