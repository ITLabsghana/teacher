
import UsersTab from '@/components/dashboard/users-tab';
import { getUsers } from '@/lib/supabase';

export default async function UsersPage() {
  const users = await getUsers(true);

  return <UsersTab initialUsers={users} />;
}
