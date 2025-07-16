
"use client";

import { useDataContext } from '@/context/data-context';
import LeaveTab from '@/components/dashboard/leave-tab';

export default function LeavePage() {
  const { leaveRequests, setLeaveRequests, teachers } = useDataContext();

  return (
    <LeaveTab leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} teachers={teachers} />
  );
}
