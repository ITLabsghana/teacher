'use server';

import { adminDb } from '@/lib/supabase-admin';

export async function uploadFile(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided.');
    }

    // The browser will pass a FormData object, but we need to convert it to a Buffer for the server-side upload.
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;

    // Hypothesis: The bucket name is 'teacher_files' not 'teacher-files'.
    const BUCKET_NAME = 'teacher_files';

    const { data, error: uploadError } = await adminDb.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
            contentType: file.type,
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
