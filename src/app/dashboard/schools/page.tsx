"use client";

import { useState } from 'react';
import type { School } from '@/lib/types';
import SchoolsTab from '@/components/dashboard/schools-tab';

// Mock data, in a real app this would come from a data store or API
const initialSchools: School[] = [];

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>(initialSchools);

  return (
    <SchoolsTab schools={schools} setSchools={setSchools} />
  );
}
