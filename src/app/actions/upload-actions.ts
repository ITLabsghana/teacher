'use server';

import { adminDb } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

// Define bucket names as constants
export const BUCKETS = {
    teacherPhotos: 'teacher_files',
    teacherDocuments: 'teacher_documents',
};

// A union type for type safety
export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

export async function createSignedUploadUrlAction(type: string, size: number, bucket: BucketName) {
    console.log(`--- [Server Action] createSignedUploadUrlAction for bucket: ${bucket} ---`);

    // 1. Validate file type and size based on bucket
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (size > MAX_FILE_SIZE) {
        throw new Error('File is too large. Maximum size is 10 MB.');
    }
    if (bucket === BUCKETS.teacherPhotos && !type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed for teacher photos.');
    }

    // 2. Generate a unique path for the file
    const fileExtension = type.split('/')[1] || 'bin';
    const path = `${randomUUID()}.${fileExtension}`;

    // 3. Create the signed upload URL
    const { data, error } = await adminDb.storage
        .from(bucket)
        .createSignedUploadUrl(path);

    if (error) {
        console.error("Error creating signed URL:", error);
        throw new Error("Could not create an upload URL. Please try again.");
    }

    // 4. Get the public URL for after the upload is complete
    const { data: { publicUrl } } = adminDb.storage.from(bucket).getPublicUrl(path);

    return {
        signedUrl: data.signedUrl,
        publicUrl: publicUrl,
        path: data.path,
    };
}

export async function uploadFile(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as BucketName | null;

    if (!file) {
        throw new Error('No file provided.');
    }
    if (!bucket || !Object.values(BUCKETS).includes(bucket)) {
        throw new Error('A valid bucket name must be provided.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;

    // Pass the File object directly to the upload method.
    const { data, error: uploadError } = await adminDb.storage
        .from(bucket)
        .upload(fileName, file, {
            upsert: true,
        });

    if (uploadError) {
        console.error('Supabase Storage Error:', uploadError);
        throw new Error(`Storage Error: ${uploadError.message}`);
    }

    // Now, get the public URL of the uploaded file
    const { data: publicUrlData } = adminDb.storage
        .from(bucket)
        .getPublicUrl(data.path);

    if (!publicUrlData) {
        throw new Error('Upload succeeded, but could not get public URL for the uploaded file.');
    }

    return publicUrlData.publicUrl;
}
