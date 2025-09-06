'use server';

import { adminDb } from '@/lib/supabase-admin';
import { addTeacher, deleteTeacher, getTeacherById, parseTeacherDates, updateTeacher } from '@/lib/supabase';
import type { Teacher } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper to extract file path from a public Supabase storage URL
function getPathFromUrl(url: string | null | undefined): { bucket: string, path: string } | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        // e.g., /storage/v1/object/public/teacher_files/some-uuid.jpg
        const pathParts = urlObject.pathname.split('/');
        // Find the index of 'public' and get the bucket and file path
        const publicIndex = pathParts.indexOf('public');
        if (publicIndex === -1 || publicIndex + 2 >= pathParts.length) {
            throw new Error('Invalid Supabase storage URL format');
        }
        const bucket = pathParts[publicIndex + 1];
        const path = pathParts.slice(publicIndex + 2).join('/');
        return { bucket, path };
    } catch (e: any) {
        console.error(`Invalid URL provided for path extraction: ${url}`, e.message);
        return null;
    }
}

// Helper to delete a file from Supabase Storage
async function deleteStorageObject(bucket: string, path: string) {
    if (!bucket || !path) return;
    try {
        const { error } = await adminDb.storage
            .from(bucket)
            .remove([path]);
        if (error) {
            console.error(`Failed to delete storage object from bucket "${bucket}" at path: ${path}`, error);
        } else {
            console.log(`Successfully deleted storage object from bucket "${bucket}": ${path}`);
        }
    } catch (e: any) {
        console.error(`Exception during storage object deletion from bucket "${bucket}": ${path}`, e.message);
    }
}

export async function searchTeachers(searchTerm: string): Promise<Teacher[]> {
    if (!searchTerm) {
        return [];
    }

    const { data, error } = await adminDb
        .rpc('search_teachers_by_term', { search_term: searchTerm })
        .limit(20);

    if (error) {
        console.error('Search Error:', error);
        return [];
    }

    // The RPC function returns a `teachers` table type, so we can still use parseTeacherDates
    return data.map(parseTeacherDates);
}

export async function deleteTeacherAction(teacherId: string): Promise<void> {
    try {
        // 1. Get the teacher's current data before deleting the record
        const teacher = await getTeacherById(teacherId, true);
        if (!teacher) {
            throw new Error("Teacher not found.");
        }

        // 2. Delete the teacher record from the database
        await deleteTeacher(teacherId);

        // 3. Delete the teacher's photo from storage
        const photoInfo = getPathFromUrl(teacher.photo);
        if (photoInfo) {
            await deleteStorageObject(photoInfo.bucket, photoInfo.path);
        }

        // 4. Delete all associated documents from storage
        if (teacher.documents && teacher.documents.length > 0) {
            for (const doc of teacher.documents) {
                const docInfo = getPathFromUrl(doc.url);
                if (docInfo) {
                    await deleteStorageObject(docInfo.bucket, docInfo.path);
                }
            }
        }

        // 5. Revalidate paths to update the UI
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/teachers');

    } catch (error: any) {
        console.error("Error in deleteTeacherAction:", error.message);
        throw new Error(`Failed to delete teacher: ${error.message}`);
    }
}

export async function addTeacherAction(teacherData: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> {
    try {
        const newTeacher = await addTeacher(teacherData);

        // Revalidate paths to update the UI
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/teachers');

        return newTeacher;
    } catch (error: any) {
        console.error("Error in addTeacherAction:", error);
        // Re-throw the error to be caught by the form
        throw new Error(`Failed to add teacher: ${error.message}`);
    }
}

export async function updateTeacherAction({ teacher, oldPhotoUrl }: { teacher: Teacher, oldPhotoUrl?: string | null }): Promise<Teacher> {
    console.log("--- [Server Action] updateTeacherAction ---");
    console.log("Received teacher data for update:", { id: teacher.id, photo: teacher.photo });
    console.log("Old photo URL for potential deletion:", oldPhotoUrl);

    try {
        // 1. Update the teacher's data in the database
        const updatedTeacher = await updateTeacher(teacher);
        console.log("Database update successful for teacher ID:", teacher.id);
        console.log("Returned photo URL from DB:", updatedTeacher.photo);

        // 2. If the photo has changed, delete the old photo from storage
        const newPhotoUrl = updatedTeacher.photo;
        if (oldPhotoUrl && oldPhotoUrl !== newPhotoUrl) {
            console.log(`Photo changed. Deleting old photo: ${oldPhotoUrl}`);
            const oldPhotoInfo = getPathFromUrl(oldPhotoUrl);
            if (oldPhotoInfo) {
                await deleteStorageObject(oldPhotoInfo.bucket, oldPhotoInfo.path);
            }
        }

        // 3. Revalidate paths to update the UI
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/teachers');

        return updatedTeacher;
    } catch (error: any) {
        console.error("Error in updateTeacherAction:", error);
        // It's better to log the whole error object for more context
        throw new Error(`Failed to update teacher: ${error.message}`);
    }
}

export async function deleteDocumentAction(teacherId: string, documentUrl: string): Promise<Teacher> {
    try {
        // 1. Get the teacher's current data
        const teacher = await getTeacherById(teacherId, true);
        if (!teacher) {
            throw new Error("Teacher not found.");
        }

        // 2. Filter out the document to be deleted
        const updatedDocuments = teacher.documents?.filter(doc => doc.url !== documentUrl) || [];

        // 3. Update the teacher record in the database
        const updatedTeacher = await updateTeacher({ ...teacher, documents: updatedDocuments });

        // 4. Delete the document file from storage
        const docInfo = getPathFromUrl(documentUrl);
        if (docInfo) {
            await deleteStorageObject(docInfo.bucket, docInfo.path);
        }

        return updatedTeacher;
    } catch (error: any) {
        console.error("Error in deleteDocumentAction:", error.message);
        throw new Error(`Failed to delete document: ${error.message}`);
    }
}
