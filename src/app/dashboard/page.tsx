"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeachersTab from '@/components/dashboard/teachers-tab';
import SchoolsTab from '@/components/dashboard/schools-tab';
import LeaveTab from '@/components/dashboard/leave-tab';
import type { Teacher, School, LeaveRequest } from '@/lib/types';
import { User, School as SchoolIcon, CalendarOff } from 'lucide-react';

export default function DashboardPage() {
  // State lifted up to preserve it across tab switches
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your institution's data from one place.</p>
        </header>

        <Tabs defaultValue="teachers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teachers">
              <User className="mr-2 h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="schools">
              <SchoolIcon className="mr-2 h-4 w-4" />
              Schools
            </TabsTrigger>
            <TabsTrigger value="leave">
              <CalendarOff className="mr-2 h-4 w-4" />
              Leave Requests
            </TabsTrigger>
          </TabsList>
          <TabsContent value="teachers" className="mt-6">
            <TeachersTab teachers={teachers} setTeachers={setTeachers} schools={schools} />
          </TabsContent>
          <TabsContent value="schools" className="mt-6">
            <SchoolsTab schools={schools} setSchools={setSchools} />
          </TabsContent>
          <TabsContent value="leave" className="mt-6">
            <LeaveTab leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} teachers={teachers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
