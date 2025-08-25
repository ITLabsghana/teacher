'use server';

import { adminDb } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

export async function createSignedUploadUrlAction(type: string, size: number) {
    console.log("--- [Server Action] createSignedUploadUrlAction ---");

    // 1. Validate file type and size
    if (!type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (size > MAX_FILE_SIZE) {
        throw new Error('File is too large. Maximum size is 10 MB.');
    }

    // 2. Generate a unique path for the file
    const BUCKET_NAME = 'teacher_files';
    const fileExtension = type.split('/')[1];
    const path = `${randomUUID()}.${fileExtension}`;

    // 3. Create the signed upload URL
    const { data, error } = await adminDb.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(path);

    if (error) {
        console.error("Error creating signed URL:", error);
        throw new Error("Could not create an upload URL. Please try again.");
    }

    // 4. Get the public URL for after the upload is complete
    const { data: { publicUrl } } = adminDb.storage.from(BUCKET_NAME).getPublicUrl(path);

    return {
        signedUrl: data.signedUrl,
        publicUrl: publicUrl,
        path: data.path,
    };
}

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
