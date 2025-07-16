
"use client";

import { useDataContext } from '@/context/data-context';
import EnrollmentTab from '@/components/dashboard/enrollment-tab';

export default function EnrollmentPage() {
  const { schools, setSchools } = useDataContext();

  return (
    <EnrollmentTab schools={schools} setSchools={setSchools} />
  );
}
