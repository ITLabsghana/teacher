import TeachersTab from '@/components/dashboard/teachers-tab';
import { getSchools } from '@/lib/supabase';

// By removing `revalidate = 0` and the initial data fetch for teachers,
// this page component becomes mostly static. It can be served to the user
// very quickly. The dynamic data will be fetched by the client component.
export default async function TeachersPage() {
    // We can still fetch small, essential data on the server if it's fast.
    // The list of schools is needed for the form dropdowns.
    const initialSchools = await getSchools(true);

    return (
        <TeachersTab
            // Pass an empty array for the initial teachers.
            // The TeachersTab component will be responsible for fetching its own data.
            initialTeachers={[]}
            initialSchools={initialSchools}
        />
    );
}
