
import { Suspense } from 'react';
import ReportsTab from '@/components/dashboard/reports-tab';

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading report data...</div>}>
      <ReportsTab />
    </Suspense>
  );
}
