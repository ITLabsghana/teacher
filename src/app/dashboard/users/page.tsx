
"use client";

import { useDataContext } from '@/context/data-context';
import UsersTab from '@/components/dashboard/users-tab';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { getUsers } from '@/lib/supabase';

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
  }, []);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <UsersTab users={users} setUsers={setUsers} />;
}
