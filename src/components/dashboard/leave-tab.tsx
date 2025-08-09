
"use client";

import { useState, useEffect } from 'react';
import type { LeaveRequest, Teacher } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { LeaveForm } from './leave-form';
import { Badge } from '@/components/ui/badge';
import { supabase, updateLeaveRequest as dbUpdateLeaveRequest } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaveTabProps {
  initialLeaveRequests: LeaveRequest[];
  initialTeachers: Teacher[];
  isLoading: boolean;
}

export default function LeaveTab({ initialLeaveRequests, initialTeachers, isLoading }: LeaveTabProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setLeaveRequests(initialLeaveRequests);
    setTeachers(initialTeachers);
  }, [initialLeaveRequests, initialTeachers]);

  useEffect(() => {
    const channel = supabase
      .channel('leave-requests-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          const newRequest = { ...(payload.new as LeaveRequest), startDate: new Date((payload.new as LeaveRequest).startDate), returnDate: new Date((payload.new as LeaveRequest).returnDate)} as LeaveRequest;
          if (payload.eventType === 'INSERT') {
            setLeaveRequests(current => [newRequest, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setLeaveRequests(current => current.map(r => r.id === newRequest.id ? newRequest : r));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as LeaveRequest).id;
            setLeaveRequests(current => current.filter(r => r.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A';
  };

  const handleUpdateStatus = async (leaveId: string, status: LeaveRequest['status']) => {
    const request = leaveRequests.find(req => req.id === leaveId);
    if(request) {
        try {
            const updatedRequest = await dbUpdateLeaveRequest({ ...request, status });
            // The real-time listener will update the state, so no need to call setLeaveRequests here.
            toast({ title: "Success", description: "Leave status updated." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }
  };
  
  const getStatusVariant = (status: LeaveRequest['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'secondary';
    }
  }

  const handleFormSave = (newRequest: LeaveRequest) => {
    // No need to manually add, real-time listener will handle it.
    setIsFormOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Leave Tracking</CardTitle>
                <CardDescription>Monitor and manage teacher leave requests.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={() => setIsFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Request</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : leaveRequests.length > 0 ? leaveRequests.map(req => (
              <TableRow key={req.id}>
                <TableCell>{getTeacherName(req.teacherId)}</TableCell>
                <TableCell>{req.leaveType}</TableCell>
                <TableCell>{new Date(req.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(req.returnDate).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(req.status)} className={req.status === 'Approved' ? 'bg-green-500' : ''}>{req.status}</Badge>
                </TableCell>
                <TableCell>
                    {req.status === 'Approved' && isWithinInterval(new Date(), { start: new Date(req.startDate), end: new Date(req.returnDate) }) ? (
                        <Badge className="bg-blue-500">Active</Badge>
                    ) : (
                        <Badge variant="outline">Inactive</Badge>
                    )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, 'Approved')}>Approved</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, 'Pending')}>Pending</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, 'Rejected')}>Rejected</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <LeaveForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        teachers={teachers}
        onSave={handleFormSave}
      />
    </Card>
  );
}
