
"use client";

import LeaveTab from '@/components/dashboard/leave-tab';
import { useEffect, useState } from 'react';
import type { LeaveRequest, Teacher } from '@/lib/types';
import { getLeaveRequests, getTeachers } from '@/lib/supabase';

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaveData, teachersData] = await Promise.all([
          getLeaveRequests(),
          getTeachers(),
        ]);
        setLeaveRequests(leaveData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Failed to fetch leave data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <LeaveTab 
      leaveRequests={leaveRequests} 
      teachers={teachers} 
      isLoading={isLoading} 
      setLeaveRequests={setLeaveRequests}
    />
  );
}
