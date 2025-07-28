
"use client";

import ReportsTab from '@/components/dashboard/reports-tab';
import { Suspense } from 'react';

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsTab />
    </Suspense>
  );
}
