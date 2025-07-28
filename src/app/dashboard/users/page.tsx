
"use client";

import UsersTab from '@/components/dashboard/users-tab';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { getUsers, supabase } from '@/lib/supabase';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();

    const channel = supabase
      .channel('users-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          const newUser = payload.new as User;
          if (payload.eventType === 'INSERT') {
            setUsers(current => [newUser, ...current]);
          }
          if (payload.eventType === 'UPDATE') {
            setUsers(current => current.map(u => u.id === newUser.id ? newUser : u));
          }
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as User).id;
            setUsers(current => current.filter(u => u.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <UsersTab users={users} setUsers={setUsers} />;
}
