
"use client";

import { useDataContext } from '@/context/data-context';
import LeaveTab from '@/components/dashboard/leave-tab';

export default function LeavePage() {
  const { leaveRequests, teachers } = useDataContext();

  return (
    <LeaveTab leaveRequests={leaveRequests} teachers={teachers} />
  );
}
