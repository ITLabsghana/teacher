
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardRealtimeWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const channel = supabase
          .channel('dashboard-realtime-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => router.refresh())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => router.refresh())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => router.refresh())
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }, [router]);

    return <>{children}</>;
}
