import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Make sure to install dotenv: npm install dotenv

// This script migrates old teacher photos to the new 'teacher_files' bucket in Supabase Storage.
// It assumes you have a .env file at the root of your project with:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.");
}

const adminDb = createClient(supabaseUrl, supabaseServiceRoleKey);

const BUCKET_NAME = 'teacher_files';

const migrateImages = async () => {
    console.log("🚀 Starting image migration script...");

    // 1. Fetch all teachers from the database
    const { data: teachers, error: fetchError } = await adminDb.from('teachers').select('id, firstName, lastName, photo');

    if (fetchError) {
        console.error("❌ Error fetching teachers:", fetchError.message);
        return;
    }

    if (!teachers || teachers.length === 0) {
        console.log("No teachers found. Nothing to migrate.");
        return;
    }

    console.log(`✅ Found ${teachers.length} total teachers. Checking for images that need migration...`);
    let migrationNeededCount = 0;
    const migrationPromises = [];

    for (const teacher of teachers) {
        const photoUrl = teacher.photo;

        // 2. Check if photoUrl exists and is an "old" URL (i.e., doesn't already point to our target bucket)
        if (photoUrl && !photoUrl.includes(BUCKET_NAME)) {
            migrationNeededCount++;

            const migrationTask = async () => {
                console.log(`\n▶️ Migrating image for teacher: ${teacher.firstName} ${teacher.lastName} (ID: ${teacher.id})`);
                console.log(`  Old URL: ${photoUrl}`);

                try {
                    // 3. Download the image from the old URL
                    const response = await fetch(photoUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to download image (status: ${response.status}): ${response.statusText}`);
                    }

                    // 3a. Check if the downloaded file is actually an image
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('image/')) {
                        throw new Error(`Invalid content type. Expected an image but received '${contentType}'. The URL may be broken or lead to a webpage.`);
                    }

                    const imageBuffer = Buffer.from(await response.arrayBuffer());
                    const fileExtension = photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
                    const newFileName = `migrated-${teacher.id}-${Date.now()}.${fileExtension}`;

                    // 4. Upload the image to the new bucket
                    const { error: uploadError } = await adminDb.storage
                        .from(BUCKET_NAME)
                        .upload(newFileName, imageBuffer, {
                            upsert: false, // Avoid overwriting any potential name collision
                            contentType: response.headers.get('content-type') || 'image/jpeg',
                        });

                    if (uploadError) {
                        throw new Error(`Supabase upload error: ${uploadError.message}`);
                    }

                    // 5. Get the new public URL
                    const { data: publicUrlData } = adminDb.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(newFileName);

                    const newPublicUrl = publicUrlData.publicUrl;
                    console.log(`  New URL: ${newPublicUrl}`);

                    // 6. Update the teacher's record in the database
                    const { error: updateError } = await adminDb
                        .from('teachers')
                        .update({ photo: newPublicUrl })
                        .eq('id', teacher.id);

                    if (updateError) {
                        throw new Error(`Database update error: ${updateError.message}`);
                    }

                    console.log(`  ✅ Successfully migrated image for teacher ID: ${teacher.id}`);

                } catch (error) {
                    console.error(`  ❌ FAILED to migrate image for teacher ID: ${teacher.id}. Reason:`, (error as Error).message);
                }
            };
            migrationPromises.push(migrationTask());
        }
    }

    if (migrationNeededCount === 0) {
        console.log("✅ No images required migration. All photos seem to be up-to-date.");
    } else {
        console.log(`\nFound ${migrationNeededCount} teachers needing photo migration. Waiting for all migrations to complete...`);
        await Promise.all(migrationPromises);
    }

    console.log("\n🚀 Image migration script finished.");
};

// Run the script
migrateImages().catch(err => {
    console.error("\nAn unexpected error occurred during the script execution:", err);
});
