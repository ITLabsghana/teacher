
"use client";

import { useEffect, useState, useRef } from 'react';
import type { Teacher, School } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, User as UserIcon, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInYears } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const teacherSchema = z.object({
  // Personal Information
  staffId: z.string().min(1, "Staff ID is required"),
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Surname is too short"),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  gender: z.enum(['Male', 'Female'], { required_error: "Gender is required" }),
  registeredNo: z.string().optional(),
  ghanaCardNo: z.string().optional(),
  ssnitNo: z.string().optional(),
  tinNo: z.string().optional(),
  phoneNo: z.string().optional(),
  homeTown: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  address: z.string().optional(),
  photo: z.string().optional(),

  // Academic and Work Information
  academicQualification: z.string().optional(),
  professionalQualification: z.string().optional(),
  otherProfessionalQualification: z.string().optional(),
  rank: z.string().optional(),
  job: z.enum(['Head Teacher', 'Class Teacher', 'Subject Teacher']).optional(),
  subjects: z.string().optional(),
  leadershipPosition: z.string().optional(),
  otherLeadershipPosition: z.string().optional(),
  areaOfSpecialization: z.string().optional(),
  lastPromotionDate: z.date().optional(),
  previousSchool: z.string().optional(),
  schoolId: z.string().optional(),
  datePostedToCurrentSchool: z.date().optional(),
  licensureNo: z.string().optional(),
  firstAppointmentDate: z.date().optional(),
  dateConfirmed: z.date().optional(),
  teacherUnion: z.string().optional(),

  // Bank and Salary Information
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountNumber: z.string().optional(),
  salaryScale: z.string().optional(),
}).refine(data => !(data.professionalQualification === 'Other' && !data.otherProfessionalQualification), {
  message: "Please specify the qualification",
  path: ["otherProfessionalQualification"],
}).refine(data => !(data.leadershipPosition === 'Other' && !data.otherLeadershipPosition), {
    message: "Please specify the position",
    path: ["otherLeadershipPosition"],
}).refine(data => !(data.job === 'Subject Teacher' && !data.subjects), {
    message: "Please specify subjects",
    path: ["subjects"],
});

type TeacherFormData = z.infer<typeof teacherSchema>;

const academicQualifications = ['SSSCE', 'WASSCE', 'Diploma', 'HND', 'B.Ed'];
const professionalQualificationsList = ['Diploma', 'B.Ed', 'M.Ed', 'PhD', 'Ed.D', 'Other'];
const ranks = ['Superintendent II', 'Superintendent I', 'Senior Superintendent II', 'Senior Superintendent I', 'Principal Superintendent', 'Assistant Director II', 'Assistant Director I', 'Deputy Director', 'Director II', 'Director I', 'Deputy Director General'];
const jobs = ['Head Teacher', 'Class Teacher', 'Subject Teacher'];
const leadershipPositionsList = ['Head Teacher', 'Assistant Head Teacher', 'Sports', 'Girl Child', 'Treasurer', 'Culture', 'Secretary', 'School Chaplain', 'ICT Facilitator', 'Project Officer', 'Academic Head (Primary)', 'Academic Head (KG)', 'Sanitation', 'Assistant School Secretary', 'Other'];
const teacherUnions = ['GNAT', 'NAGRAT', 'CCT'];

interface TeacherFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingTeacher: Teacher | null;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schools: School[];
}

export function TeacherForm({ isOpen, setIsOpen, editingTeacher, setTeachers, schools }: TeacherFormProps) {
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
  });
  
  const [age, setAge] = useState<number | null>(null);
  const dob = watch('dateOfBirth');
  const professionalQualification = watch('professionalQualification');
  const leadershipPosition = watch('leadershipPosition');
  const job = watch('job');
  const photo = watch('photo');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTeacher && teacherSchema.shape) {
      const teacherData: Partial<TeacherFormData> = {};
      for (const key in editingTeacher) {
        const typedKey = key as keyof Teacher;
        if (Object.prototype.hasOwnProperty.call(teacherSchema.shape, typedKey)) {
          let value = editingTeacher[typedKey];

          // Ensure date fields are Date objects
          const dateFields = ['dateOfBirth', 'lastPromotionDate', 'datePostedToCurrentSchool', 'firstAppointmentDate', 'dateConfirmed'];
          if (dateFields.includes(key) && value && typeof value === 'string') {
            value = new Date(value);
          }
          
          // @ts-ignore
          teacherData[typedKey] = value instanceof Date ? value : (value !== null ? value : undefined);
        }
      }
      reset(teacherData);
    } else {
      reset({
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        schoolId: '',
        staffId: ''
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

  const handleGhanaCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    value = value.replace('GHA', '').replace(/-/g, '');
    let formatted = 'GHA-';
    if (value.length > 0) {
        formatted += value.substring(0, 7);
    }
    if (value.length >= 8) {
        formatted += '-' + value.substring(7, 8);
    }
    setValue('ghanaCardNo', formatted);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setValue('photo', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const onSubmit = (data: TeacherFormData) => {
    if (editingTeacher) {
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, ...data, id: t.id } : t));
    } else {
      setTeachers(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    }
    setIsOpen(false);
  };
  
  const renderDatePicker = (name: keyof TeacherFormData, label: string) => (
    <div>
        <Label>{label}</Label>
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar 
                            mode="single" 
                            selected={field.value as Date} 
                            onSelect={field.onChange}
                            captionLayout="dropdown-nav"
                            fromYear={1950}
                            toYear={new Date().getFullYear()}
                            initialFocus 
                        />
                    </PopoverContent>
                </Popover>
            )}
        />
        {errors[name] && <p className="text-destructive text-xs mt-1">{(errors[name] as any)?.message}</p>}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) reset(); }}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
          <DialogDescription>
            {editingTeacher ? "Update the teacher's profile details." : "Fill in the details for the new teacher."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <ScrollArea className="h-[calc(80vh-100px)] pr-6">
                <div className="space-y-6 py-4">
                    {/* Photo and Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center gap-4">
                            <Label>Teacher's Picture</Label>
                            <div className="w-40 h-40 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                {photo ? <Image src={photo} alt="Teacher" width={160} height={160} className="object-cover w-full h-full" /> : <UserIcon className="w-20 h-20 text-muted-foreground" />}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" /> Add
                                </Button>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                                {photo && <Button type="button" size="sm" variant="destructive" onClick={() => setValue('photo', undefined)}><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>}
                            </div>
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Staff ID</Label><Input {...register('staffId')} /><p className="text-destructive text-xs mt-1">{errors.staffId?.message}</p></div>
                            <div><Label>First Name</Label><Input {...register('firstName')} /><p className="text-destructive text-xs mt-1">{errors.firstName?.message}</p></div>
                            <div><Label>Surname & Other Names</Label><Input {...register('lastName')} /><p className="text-destructive text-xs mt-1">{errors.lastName?.message}</p></div>
                            {renderDatePicker('dateOfBirth', 'Date of Birth')}
                             <div><Label>Age</Label><Input value={age !== null ? age : ''} readOnly className="bg-muted" /></div>
                            <div><Label>Gender</Label><Controller control={control} name="gender" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select> )} /><p className="text-destructive text-xs mt-1">{errors.gender?.message}</p></div>
                        </div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Contact & Identification</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div><Label>Registered No.</Label><Input {...register('registeredNo')} /></div>
                        <div><Label>Ghana Card No.</Label><Input {...register('ghanaCardNo')} placeholder="GHA-XXXXXXX-X" onChange={handleGhanaCardChange} /></div>
                        <div><Label>SSNIT No.</Label><Input {...register('ssnitNo')} /></div>
                        <div><Label>TIN No.</Label><Input {...register('tinNo')} /></div>
                        <div><Label>Phone No.</Label><Input {...register('phoneNo')} /></div>
                        <div><Label>Home Town</Label><Input {...register('homeTown')} /></div>
                        <div><Label>E-Mail</Label><Input type="email" {...register('email')} /><p className="text-destructive text-xs mt-1">{errors.email?.message}</p></div>
                        <div className="sm:col-span-2"><Label>Address</Label><Input {...register('address')} /></div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Academic and Work Information</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div><Label>Academic Qualification</Label><Controller control={control} name="academicQualification" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{academicQualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select> )}/></div>
                        <div><Label>Professional Qualification</Label><Controller control={control} name="professionalQualification" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{professionalQualificationsList.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select> )}/></div>
                        {professionalQualification === 'Other' && <div><Label>Specify Other</Label><Input {...register('otherProfessionalQualification')} /><p className="text-destructive text-xs mt-1">{errors.otherProfessionalQualification?.message}</p></div>}
                        <div><Label>Rank</Label><Controller control={control} name="rank" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{ranks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select> )}/></div>
                        <div><Label>Job</Label><Controller control={control} name="job" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{jobs.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select> )}/></div>
                        {job === 'Subject Teacher' && <div><Label>Subjects</Label><Input {...register('subjects')} /><p className="text-destructive text-xs mt-1">{errors.subjects?.message}</p></div>}
                        <div><Label>Leadership Position</Label><Controller control={control} name="leadershipPosition" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{leadershipPositionsList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select> )}/></div>
                        {leadershipPosition === 'Other' && <div><Label>Specify Other</Label><Input {...register('otherLeadershipPosition')} /><p className="text-destructive text-xs mt-1">{errors.otherLeadershipPosition?.message}</p></div>}
                        <div><Label>Area Of Specialization</Label><Input {...register('areaOfSpecialization')} /></div>
                        {renderDatePicker('lastPromotionDate', 'Last Promotion Date')}
                        <div><Label>Previous School</Label><Input {...register('previousSchool')} /></div>
                        <div><Label>Current School</Label><Controller control={control} name="schoolId" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger><SelectContent>{schools.map(school => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}</SelectContent></Select>)} /><p className="text-destructive text-xs mt-1">{errors.schoolId?.message}</p></div>
                        {renderDatePicker('datePostedToCurrentSchool', 'Date Posted To Current School')}
                        <div><Label>Licensure No.</Label><Input {...register('licensureNo')} /></div>
                        {renderDatePicker('firstAppointmentDate', 'First Appointment Date')}
                        {renderDatePicker('dateConfirmed', 'Date Confirmed')}
                        <div><Label>Teacher Union</Label><Controller control={control} name="teacherUnion" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{teacherUnions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> )}/></div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Bank and Salary Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                         <div><Label>Name Of Bank</Label><Input {...register('bankName')} /></div>
                         <div><Label>Branch</Label><Input {...register('bankBranch')} /></div>
                         <div><Label>Account Number</Label><Input {...register('accountNumber')} /></div>
                         <div><Label>Salary Scale</Label><Input {...register('salaryScale')} /></div>
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">{editingTeacher ? 'Save Changes' : 'Add Teacher'}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
