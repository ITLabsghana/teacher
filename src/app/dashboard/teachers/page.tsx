
import TeachersTab from '@/components/dashboard/teachers-tab';
import { getTeachers, getSchools } from '@/lib/supabase';

// This forces the page to be dynamically rendered and not cached.
// This is crucial for ensuring the latest data is fetched from the database
// when the user navigates to the page or after a router.refresh().
export const revalidate = 0;

export default async function TeachersPage() {
    const [initialTeachers, initialSchools] = await Promise.all([
        getTeachers(0, 20, true),
        getSchools(true),
    ]);

    return (
        <TeachersTab
            initialTeachers={initialTeachers}
            initialSchools={initialSchools}
        />
    );
}
