
"use client";

import type { LeaveRequest, Teacher } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerSelect } from '@/components/dashboard/teacher-form';
import { useToast } from '@/hooks/use-toast';
import { addLeaveRequest as dbAddLeaveRequest } from '@/lib/supabase';

const leaveTypes: LeaveRequest['leaveType'][] = ['Study Leave (with pay)', 'Study Leave (without pay)', 'Sick', 'Maternity', 'Paternity', 'Casual', 'Other'];

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
  teachers: Teacher[];
  onSave: (newRequest: LeaveRequest) => void;
}

export function LeaveForm({ isOpen, setIsOpen, teachers, onSave }: LeaveFormProps) {
  const { toast } = useToast();
  const { handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
  });

  const onSubmit = async (data: z.infer<typeof leaveSchema>) => {
    try {
        const newRequest = await dbAddLeaveRequest(data);
        toast({ title: 'Success', description: 'Leave request submitted.' });
        onSave(newRequest);
        reset();
    } catch(err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const renderDatePicker = (name: "startDate" | "returnDate", label: string) => (
    <div>
        <Label>{label}</Label>
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <DatePickerSelect
                    value={field.value as Date | undefined}
                    onChange={field.onChange}
                />
            )}
        />
        {errors[name] && <p className="text-destructive text-xs mt-1">{(errors[name] as any)?.message}</p>}
    </div>
  );

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
          <div className="grid grid-cols-1 gap-4">
            {renderDatePicker("startDate", "Start Date")}
            {renderDatePicker("returnDate", "Return Date")}
             {errors.returnDate && <p className="text-destructive text-xs -mt-3 text-center">{errors.returnDate.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full mt-4 bg-accent hover:bg-accent/90">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
