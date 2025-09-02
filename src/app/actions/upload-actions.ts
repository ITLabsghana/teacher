'use server';

import { adminDb } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

const BUCKETS = {
    teacherPhotos: 'teacher_files',
    teacherDocuments: 'teacher_documents',
};

export async function createSignedPhotoUploadUrlAction(type: string, size: number) {
    console.log(`--- [Server Action] createSignedPhotoUploadUrlAction ---`);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (size > MAX_FILE_SIZE) {
        throw new Error('File is too large. Maximum size is 10 MB.');
    }
    if (!type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed for teacher photos.');
    }

    const fileExtension = type.split('/')[1] || 'bin';
    const path = `${randomUUID()}.${fileExtension}`;

    const { data, error } = await adminDb.storage
        .from(BUCKETS.teacherPhotos)
        .createSignedUploadUrl(path);

    if (error) {
        console.error("Error creating signed URL for photo:", error);
        throw new Error("Could not create an upload URL. Please try again.");
    }

    const { data: { publicUrl } } = adminDb.storage.from(BUCKETS.teacherPhotos).getPublicUrl(path);

    return {
        signedUrl: data.signedUrl,
        publicUrl: publicUrl,
        path: data.path,
    };
}

export async function uploadDocumentAction(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file provided.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;

    const { data, error: uploadError } = await adminDb.storage
        .from(BUCKETS.teacherDocuments)
        .upload(fileName, file, {
            upsert: true,
        });

    if (uploadError) {
        console.error('Supabase Storage Error during document upload:', uploadError);
        throw new Error(`Storage Error: ${uploadError.message}`);
    }

    const { data: publicUrlData } = adminDb.storage
        .from(BUCKETS.teacherDocuments)
        .getPublicUrl(data.path);

    if (!publicUrlData) {
        throw new Error('Upload succeeded, but could not get public URL for the uploaded document.');
    }

    return publicUrlData.publicUrl;
}
