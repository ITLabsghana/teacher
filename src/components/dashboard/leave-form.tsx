
"use client";

import type { LeaveRequest, Teacher } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const leaveTypes: LeaveRequest['leaveType'][] = ['Sick', 'Vacation', 'Personal', 'Other'];

const leaveSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  leaveType: z.enum(leaveTypes, { required_error: "Leave type is required" }),
  startDate: z.date({ required_error: "Start date is required." }),
  returnDate: z.date({ required_error: "Return date is required." }),
}).refine(data => data.returnDate >= data.startDate, {
  message: "Return date cannot be before start date.",
  path: ["returnDate"],
});


interface LeaveFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  teachers: Teacher[];
}

export function LeaveForm({ isOpen, setIsOpen, setLeaveRequests, teachers }: LeaveFormProps) {
  const { handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
  });

  const onSubmit = (data: z.infer<typeof leaveSchema>) => {
    const newRequest: LeaveRequest = {
        ...data,
        id: crypto.randomUUID(),
        status: 'Pending'
    };
    setLeaveRequests(prev => [...prev, newRequest]);
    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) reset(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Leave Request</DialogTitle>
          <DialogDescription>
            Submit a new leave request for a teacher.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label>Teacher</Label>
            <Controller
                control={control}
                name="teacherId"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                            {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.teacherId && <p className="text-destructive text-xs mt-1">{errors.teacherId.message}</p>}
          </div>
          <div>
            <Label>Leave Type</Label>
            <Controller
                control={control}
                name="leaveType"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {leaveTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.leaveType && <p className="text-destructive text-xs mt-1">{errors.leaveType.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
               <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                captionLayout="dropdown-nav"
                                fromYear={1950}
                                toYear={new Date().getFullYear() + 5}
                                initialFocus 
                            />
                        </PopoverContent>
                    </Popover>
                  )}
                />
              {errors.startDate && <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <Label>Return Date</Label>
               <Controller
                  control={control}
                  name="returnDate"
                  render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                             <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                captionLayout="dropdown-nav"
                                fromYear={1950}
                                toYear={new Date().getFullYear() + 5}
                                initialFocus 
                            />
                        </PopoverContent>
                    </Popover>
                  )}
                />
              {errors.returnDate && <p className="text-destructive text-xs mt-1">{errors.returnDate.message}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full mt-4 bg-accent hover:bg-accent/90">Submit Request</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
