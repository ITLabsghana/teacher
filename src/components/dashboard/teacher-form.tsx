"use client";

import { useEffect, useState } from 'react';
import type { Teacher, School } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInYears } from 'date-fns';

const teacherSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  schoolId: z.string().min(1, "School is required"),
  subject: z.string().min(2, "Subject is too short"),
});

interface TeacherFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingTeacher: Teacher | null;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schools: School[];
}

export function TeacherForm({ isOpen, setIsOpen, editingTeacher, setTeachers, schools }: TeacherFormProps) {
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
  });
  
  const [age, setAge] = useState<number | null>(null);
  const dob = watch('dateOfBirth');

  useEffect(() => {
    if (editingTeacher) {
      reset({
        ...editingTeacher,
        dateOfBirth: new Date(editingTeacher.dateOfBirth),
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        schoolId: '',
        subject: ''
      });
    }
  }, [editingTeacher, isOpen, reset]);
  
  useEffect(() => {
    if (dob) {
      setAge(differenceInYears(new Date(), dob));
    } else {
      setAge(null);
    }
  }, [dob]);

  const onSubmit = (data: z.infer<typeof teacherSchema>) => {
    if (editingTeacher) {
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...data, id: t.id } : t));
    } else {
      setTeachers(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
          <DialogDescription>
            {editingTeacher ? "Update the teacher's profile details." : "Fill in the details for the new teacher."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
               <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                  )}
                />
              {errors.dateOfBirth && <p className="text-destructive text-xs mt-1">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" value={age !== null ? age : ''} readOnly className="bg-muted" />
            </div>
          </div>
          <div>
            <Label>School</Label>
            <Controller
                control={control}
                name="schoolId"
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a school" />
                        </SelectTrigger>
                        <SelectContent>
                            {schools.map(school => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.schoolId && <p className="text-destructive text-xs mt-1">{errors.schoolId.message}</p>}
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register('subject')} />
            {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject.message}</p>}
          </div>
          <Button type="submit" className="w-full mt-4 bg-accent hover:bg-accent/90">{editingTeacher ? 'Save Changes' : 'Add Teacher'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
