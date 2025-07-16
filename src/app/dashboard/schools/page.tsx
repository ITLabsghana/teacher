
"use client";

import { useDataContext } from '@/context/data-context';
import SchoolsTab from '@/components/dashboard/schools-tab';
import EnrollmentTab from '@/components/dashboard/enrollment-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SchoolsPage() {
  const { schools, setSchools } = useDataContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Management</CardTitle>
        <CardDescription>Add, edit, and manage schools and their student enrollment.</CardDescription>
      </CardHeader>
      <CardContent>
        <SchoolsTab schools={schools} setSchools={setSchools} />
      </CardContent>
    </Card>
  );
}
