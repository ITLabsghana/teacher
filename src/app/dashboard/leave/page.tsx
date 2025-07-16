"use client";

import { useState } from 'react';
import type { LeaveRequest, Teacher } from '@/lib/types';
import LeaveTab from '@/components/dashboard/leave-tab';

// Mock data, in a real app this would come from a data store or API
const initialLeaveRequests: LeaveRequest[] = [];
const initialTeachers: Teacher[] = [];

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [teachers] = useState<Teacher[]>(initialTeachers);

  return (
    <LeaveTab leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} teachers={teachers} />
  );
}
