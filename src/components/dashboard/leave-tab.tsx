
"use client";

import { useState } from 'react';
import type { LeaveRequest, Teacher } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { LeaveForm } from './leave-form';
import { Badge } from '@/components/ui/badge';
import { useDataContext } from '@/context/data-context';

interface LeaveTabProps {
  leaveRequests: LeaveRequest[];
  teachers: Teacher[];
}

export default function LeaveTab({ leaveRequests, teachers }: LeaveTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { updateLeaveRequest } = useDataContext();

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A';
  };

  const handleUpdateStatus = (leaveId: string, status: LeaveRequest['status']) => {
    const request = leaveRequests.find(req => req.id === leaveId);
    if(request) {
        updateLeaveRequest({ ...request, status });
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveRequests.length > 0 ? leaveRequests.map(req => (
              <TableRow key={req.id}>
                <TableCell>{getTeacherName(req.teacherId)}</TableCell>
                <TableCell>{req.leaveType}</TableCell>
                <TableCell>{new Date(req.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(req.returnDate).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(req.status)} className={req.status === 'Approved' ? 'bg-green-500' : ''}>{req.status}</Badge>
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
      />
    </Card>
  );
}
