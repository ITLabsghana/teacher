
"use client";

import LeaveTab from '@/components/dashboard/leave-tab';
import { useEffect, useState } from 'react';
import type { LeaveRequest, Teacher } from '@/lib/types';
import { getLeaveRequests, getTeachers, supabase } from '@/lib/supabase';

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaveData, teachersData] = await Promise.all([
          getLeaveRequests(false),
          getTeachers(0, 10000, false),
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

    const channel = supabase
      .channel('leave-requests-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          const newRequest = { ...(payload.new as LeaveRequest), startDate: new Date((payload.new as LeaveRequest).startDate), returnDate: new Date((payload.new as LeaveRequest).returnDate)} as LeaveRequest;
          if (payload.eventType === 'INSERT') {
            setLeaveRequests(current => [newRequest, ...current]);
          }
          if (payload.eventType === 'UPDATE') {
            setLeaveRequests(current => current.map(r => r.id === newRequest.id ? newRequest : r));
          }
          // Note: DELETE on leave_requests might need more complex logic if there are FK constraints
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  return (
    <LeaveTab 
      initialLeaveRequests={leaveRequests} 
      initialTeachers={teachers} 
      isLoading={isLoading} 
    />
  );
}
