
"use client";

import { useEffect, useState, useRef } from 'react';
import type { Teacher } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User as UserIcon, Trash2, Upload, File as FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInYears } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useDataContext } from '@/context/data-context';


// Date Picker Component using 3 Selects
export const DatePickerSelect = ({ value, onChange, fromYear = 1950, toYear = new Date().getFullYear(), hasError }: { value?: Date, onChange: (date?: Date) => void, fromYear?: number, toYear?: number, hasError?: boolean }) => {
    const [day, setDay] = useState<string>(value ? String(value.getDate()) : '');
    const [month, setMonth] = useState<string>(value ? String(value.getMonth()) : '');
    const [year, setYear] = useState<string>(value ? String(value.getFullYear()) : '');

    useEffect(() => {
        if (value) {
            setDay(String(value.getDate()));
            setMonth(String(value.getMonth()));
            setYear(String(value.getFullYear()));
        } else {
            setDay('');
            setMonth('');
            setYear('');
        }
    }, [value]);

    const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
        if (newDay && newMonth && newYear) {
            const date = new Date(parseInt(newYear), parseInt(newMonth), parseInt(newDay));
            onChange(date);
        } else {
            onChange(undefined);
        }
    };
    
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
    const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => String(toYear - i));

    return (
        <div className={cn("flex gap-2", hasError ? "rounded-md ring-2 ring-offset-2 ring-destructive" : "")}>
            <Select value={day} onValueChange={d => { setDay(d); handleDateChange(d, month, year); }}>
                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent><ScrollArea className="h-48">{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</ScrollArea></SelectContent>
            </Select>
            <Select value={month} onValueChange={m => { setMonth(m); handleDateChange(day, m, year); }}>
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent><ScrollArea className="h-48">{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</ScrollArea></SelectContent>
            </Select>
            <Select value={year} onValueChange={y => { setYear(y); handleDateChange(day, month, y); }}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent><ScrollArea className="h-48">{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</ScrollArea></SelectContent>
            </Select>
        </div>
    );
};


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
  lastPromotionDate: z.date().nullable().optional(),
  previousSchool: z.string().optional(),
  schoolId: z.string().nullable().optional(),
  datePostedToCurrentSchool: z.date().nullable().optional(),
  licensureNo: z.string().optional(),
  firstAppointmentDate: z.date().nullable().optional(),
  dateConfirmed: z.date().nullable().optional(),
  teacherUnion: z.string().optional(),

  // Bank and Salary Information
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountNumber: z.string().optional(),
  salaryScale: z.string().optional(),

  // Documents
  documents: z.array(z.object({
      name: z.string(),
      url: z.string()
  })).optional(),
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
}

export function TeacherForm({ isOpen, setIsOpen, editingTeacher }: TeacherFormProps) {
  const { toast } = useToast();
  const { schools, addTeacher, updateTeacher } = useDataContext();
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
  });
  
  const [age, setAge] = useState<number | null>(null);
  const dob = watch('dateOfBirth');
  const professionalQualification = watch('professionalQualification');
  const leadershipPosition = watch('leadershipPosition');
  const job = watch('job');
  const photo = watch('photo');
  const documents = watch('documents', []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultValues: Partial<TeacherFormData> = {
      staffId: '', firstName: '', lastName: '', dateOfBirth: undefined, gender: undefined,
      registeredNo: '', ghanaCardNo: 'GHA-', ssnitNo: '', tinNo: '', phoneNo: '', homeTown: '',
      email: '', address: '', photo: '', academicQualification: '', professionalQualification: '',
      otherProfessionalQualification: '', rank: '', job: undefined, subjects: '', leadershipPosition: '',
      otherLeadershipPosition: '', areaOfSpecialization: '', lastPromotionDate: null, previousSchool: '',
      schoolId: null, datePostedToCurrentSchool: null, licensureNo: '', firstAppointmentDate: null,
      dateConfirmed: null, teacherUnion: '', bankName: '', bankBranch: '', accountNumber: '',
      salaryScale: '', documents: [],
    };

    if (editingTeacher) {
      reset(editingTeacher);
    } else {
      reset(defaultValues);
    }
  }, [editingTeacher, reset]);
  
  useEffect(() => {
    if (dob) {
      setAge(differenceInYears(new Date(), dob));
    } else {
      setAge(null);
    }
  }, [dob]);

  const handleGhanaCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const prefix = "GHA-";
      let value = e.target.value;
      const digits = value.replace(/[^0-9]/g, "");
      const truncatedDigits = digits.substring(0, 10);
      
      let formattedValue = prefix;
      if (truncatedDigits.length > 0) {
        formattedValue += truncatedDigits.substring(0, 9);
      }
      if (truncatedDigits.length > 9) {
        formattedValue += '-' + truncatedDigits.substring(9);
      }
      setValue('ghanaCardNo', formattedValue);
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

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDocument = { name: file.name, url: reader.result as string };
        setValue('documents', [...(documents || []), newDocument]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDocumentNameChange = (index: number, newName: string) => {
      const updatedDocuments = [...(documents || [])];
      updatedDocuments[index].name = newName;
      setValue('documents', updatedDocuments);
  };

  const removeDocument = (index: number) => {
      const updatedDocuments = [...(documents || [])];
      updatedDocuments.splice(index, 1);
      setValue('documents', updatedDocuments);
  };

  const onSubmit = async (data: TeacherFormData) => {
    console.log('[TeacherForm] Form submitted. Data: ', data);
    try {
        if (editingTeacher) {
          console.log('[TeacherForm] Editing existing teacher.');
          const finalData = { ...editingTeacher, ...data };
          await updateTeacher(finalData);
          toast({ title: 'Success', description: 'Teacher profile updated.' });
        } else {
          await addTeacher(data);
          toast({ title: 'Success', description: 'New teacher added.' });
        }
        setIsOpen(false);
    } catch(err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message || "An unknown error occurred." });
    }
  };
  
  const renderDatePicker = (name: keyof TeacherFormData, label: string) => (
    <div>
        <Label>{label}</Label>
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <DatePickerSelect
                    value={field.value as Date | undefined}
                    onChange={field.onChange}
                    hasError={!!errors[name]}
                />
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
                            <div><Label>Staff ID</Label><Input {...register('staffId')} className={cn(errors.staffId && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.staffId?.message}</p></div>
                            <div><Label>First Name</Label><Input {...register('firstName')} className={cn(errors.firstName && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.firstName?.message}</p></div>
                            <div><Label>Surname & Other Names</Label><Input {...register('lastName')} className={cn(errors.lastName && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.lastName?.message}</p></div>
                            {renderDatePicker('dateOfBirth', 'Date of Birth')}
                             <div><Label>Age</Label><Input value={age !== null ? age : ''} readOnly className="bg-muted" /></div>
                            <div><Label>Gender</Label><Controller control={control} name="gender" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger className={cn(errors.gender && "border-destructive")}><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select> )} /><p className="text-destructive text-xs mt-1">{errors.gender?.message}</p></div>
                        </div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Contact & Identification</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div><Label>Registered No.</Label><Input {...register('registeredNo')} /></div>
                        <div>
                          <Label>Ghana Card No.</Label>
                          <Controller 
                            control={control} 
                            name="ghanaCardNo" 
                            defaultValue="GHA-"
                            render={({ field }) => ( 
                              <Input 
                                {...field} 
                                placeholder="GHA-XXXXXXXXX-X" 
                                onChange={handleGhanaCardChange}
                                maxLength={14}
                              /> 
                            )}
                          />
                        </div>
                        <div><Label>SSNIT No.</Label><Input {...register('ssnitNo')} /></div>
                        <div><Label>TIN No.</Label><Input {...register('tinNo')} /></div>
                        <div><Label>Phone No.</Label><Input {...register('phoneNo')} /></div>
                        <div><Label>Home Town</Label><Input {...register('homeTown')} /></div>
                        <div><Label>E-Mail</Label><Input type="email" {...register('email')} className={cn(errors.email && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.email?.message}</p></div>
                        <div className="sm:col-span-2"><Label>Address</Label><Input {...register('address')} /></div>
                    </div>

                    <Separator />
                    <h3 className="text-lg font-medium">Academic and Work Information</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div><Label>Academic Qualification</Label><Controller control={control} name="academicQualification" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{academicQualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select> )}/></div>
                        <div><Label>Professional Qualification</Label><Controller control={control} name="professionalQualification" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{professionalQualificationsList.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select> )}/></div>
                        {professionalQualification === 'Other' && <div><Label>Specify Other</Label><Input {...register('otherProfessionalQualification')} className={cn(errors.otherProfessionalQualification && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.otherProfessionalQualification?.message}</p></div>}
                        <div><Label>Rank</Label><Controller control={control} name="rank" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{ranks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select> )}/></div>
                        <div><Label>Job</Label><Controller control={control} name="job" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{jobs.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select> )}/></div>
                        {job === 'Subject Teacher' && <div><Label>Subjects</Label><Input {...register('subjects')} className={cn(errors.subjects && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.subjects?.message}</p></div>}
                        <div><Label>Leadership Position</Label><Controller control={control} name="leadershipPosition" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{leadershipPositionsList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select> )}/></div>
                        {leadershipPosition === 'Other' && <div><Label>Specify Other</Label><Input {...register('otherLeadershipPosition')} className={cn(errors.otherLeadershipPosition && "border-destructive")} /><p className="text-destructive text-xs mt-1">{errors.otherLeadershipPosition?.message}</p></div>}
                        <div><Label>Area Of Specialization</Label><Input {...register('areaOfSpecialization')} /></div>
                        {renderDatePicker('lastPromotionDate', 'Last Promotion Date')}
                        <div><Label>Previous School</Label><Input {...register('previousSchool')} /></div>
                        <div><Label>Current School</Label><Controller control={control} name="schoolId" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value ?? undefined}><SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger><SelectContent>{schools.map(school => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}</SelectContent></Select>)} /><p className="text-destructive text-xs mt-1">{errors.schoolId?.message}</p></div>
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

                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium">Documents</h3>
                      <p className="text-sm text-muted-foreground mb-4">Add teacher documents like certificates.</p>
                      <div className="space-y-4">
                          <div className="space-y-2">
                              {documents?.map((doc, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                                      <Input 
                                          value={doc.name} 
                                          onChange={(e) => handleDocumentNameChange(index, e.target.value)}
                                          className="flex-grow"
                                      />
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(index)}>
                                          <X className="h-4 w-4 text-destructive" />
                                      </Button>
                                  </div>
                              ))}
                          </div>
                          <Button 
                              type="button" 
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary/10"
                              onClick={() => docFileInputRef.current?.click()}
                          >
                              <Upload className="mr-2 h-4 w-4" /> 
                              {documents && documents.length > 0 ? 'Upload Another Document' : 'Upload Document'}
                          </Button>
                          <input type="file" ref={docFileInputRef} onChange={handleDocumentUpload} className="hidden" />
                      </div>
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
