
import { getSchools } from '@/lib/supabase';
import SchoolsPageClient from './client-page';

export default async function SchoolsPage() {
  // Fetch initial data on the server
  const schools = await getSchools(true);

  return <SchoolsPageClient initialSchools={schools} />;
}
