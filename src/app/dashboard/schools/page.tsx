
"use client";

import { useDataContext } from '@/context/data-context';
import SchoolsTab from '@/components/dashboard/schools-tab';

export default function SchoolsPage() {
  const { schools, setSchools } = useDataContext();

  return (
    <SchoolsTab schools={schools} setSchools={setSchools} />
  );
}
