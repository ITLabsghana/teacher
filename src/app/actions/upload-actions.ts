'use server';

import { adminDb } from '@/lib/supabase-admin';

export async function uploadFile(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const BUCKET_NAME = 'teacher_files';

    // Pass the File object directly to the upload method.
    // The Supabase client library is designed to handle this correctly, even in a server environment.
    // This avoids potential issues with manual Buffer conversion.
    const { data, error: uploadError } = await adminDb.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
            upsert: true,
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(`Storage Error: ${uploadError.message}`);
    }

    // Now, get the public URL of the uploaded file
    const { data: publicUrlData } = adminDb.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    if (!publicUrlData) {
        throw new Error('Upload succeeded, but could not get public URL for the uploaded file.');
    }

    return publicUrlData.publicUrl;
}
