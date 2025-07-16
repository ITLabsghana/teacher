
"use client";

import { useDataContext } from '@/context/data-context';
import UsersTab from '@/components/dashboard/users-tab';

export default function UsersPage() {
  const { users, setUsers, isLoading } = useDataContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <UsersTab users={users} setUsers={setUsers} />;
}
