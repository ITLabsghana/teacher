'use server';

import { adminDb } from '@/lib/supabase-admin';

export async function uploadFile(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided.');
    }

    // Use the file name and a timestamp to create a unique path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;

    // The Supabase client can directly handle FormData.
    // We pass the file itself, and the library handles the buffer/stream.
    const { data, error: uploadError } = await adminDb.storage
        .from('teacher-files')
        .upload(fileName, file, {
            upsert: true, // Overwrite file if it exists
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        // Provide a more specific error message from the Supabase error object.
        throw new Error(`Storage Error: ${uploadError.message}`);
    }

    // After a successful upload, get the public URL.
    const { data: publicUrlData } = adminDb.storage
        .from('teacher-files')
        .getPublicUrl(data.path);

    if (!publicUrlData) {
        // This case is unlikely if the upload succeeded, but it's good practice to handle it.
        throw new Error('Upload succeeded, but failed to get the public URL.');
    }

    return publicUrlData.publicUrl;
}
