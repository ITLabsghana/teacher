'use server';

import { adminDb } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file provided.');
    }
    
    // The browser will pass a FormData object, but we need to convert it to a Buffer for the server-side upload.
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    const { data, error } = await adminDb.storage
        .from('teacher-files')
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
        });

    if (error) {
        throw new Error(`Storage Error: ${error.message}`);
    }

    // Now, get the public URL of the uploaded file
    const { data: publicUrlData } = adminDb.storage
        .from('teacher-files')
        .getPublicUrl(data.path);

    if (!publicUrlData) {
        throw new Error('Could not get public URL for the uploaded file.');
    }

    return publicUrlData.publicUrl;
}
