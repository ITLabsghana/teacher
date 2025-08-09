'use server';

import { adminDb } from '@/lib/supabase-admin';

export async function uploadFile(formData: FormData): Promise<string> {
    try {
        const file = formData.get('file') as File;

        if (!file) {
            throw new Error('No file provided.');
        }

        // The browser will pass a FormData object, but we need to convert it to a Buffer for the server-side upload.
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExtension}`;

        const { data, error } = await adminDb.storage
            .from('teacher-files')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            throw new Error(`Storage Error: ${JSON.stringify(error)}`);
        }

        // Now, get the public URL of the uploaded file
        const { data: publicUrlData } = adminDb.storage
            .from('teacher-files')
            .getPublicUrl(data.path);

        if (!publicUrlData) {
            throw new Error('Could not get public URL for the uploaded file.');
        }

        return publicUrlData.publicUrl;
    } catch (error: any) {
        console.error('Upload Action Error:', error);
        throw new Error(`An unexpected error occurred: ${error.message}`);
    }
}
