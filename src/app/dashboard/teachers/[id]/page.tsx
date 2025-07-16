
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { TeacherForm } from '@/components/dashboard/teacher-form';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

export default function TeacherDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { teachers, schools, setTeachers } = useDataContext();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const teacherId = params.id as string;
    const teacher = teachers.find(t => t.id === teacherId);

    if (!teacher) {
        return <div className="text-center py-10">Teacher not found.</div>;
    }

    const getSchoolName = (schoolId?: string) => {
        if (!schoolId) return 'N/A';
        return schools.find(s => s.id === schoolId)?.name || 'N/A';
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
    };

    const handleDelete = () => {
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        router.push('/dashboard/teachers');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Teachers
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this teacher's profile.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={teacher.photo} alt={`${teacher.firstName} ${teacher.lastName}`} />
                            <AvatarFallback>{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-4xl">{teacher.firstName} {teacher.lastName}</CardTitle>
                            <CardDescription className="text-lg">{teacher.job} | {teacher.rank}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Separator className="my-4" />
                    
                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <DetailItem label="Staff ID" value={teacher.staffId} />
                        <DetailItem label="Date of Birth" value={teacher.dateOfBirth ? format(teacher.dateOfBirth, 'PPP') : null} />
                        <DetailItem label="Age" value={teacher.dateOfBirth ? differenceInYears(new Date(), teacher.dateOfBirth) : null} />
                        <DetailItem label="Gender" value={teacher.gender} />
                        <DetailItem label="Email" value={teacher.email} />
                        <DetailItem label="Phone No." value={teacher.phoneNo} />
                        <DetailItem label="Address" value={teacher.address} />
                        <DetailItem label="Home Town" value={teacher.homeTown} />
                    </div>

                    <Separator className="my-4" />
                    <h3 className="text-xl font-semibold mb-4">Identification</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <DetailItem label="Registered No." value={teacher.registeredNo} />
                        <DetailItem label="Ghana Card No." value={teacher.ghanaCardNo} />
                        <DetailItem label="SSNIT No." value={teacher.ssnitNo} />
                        <DetailItem label="TIN No." value={teacher.tinNo} />
                        <DetailItem label="Licensure No." value={teacher.licensureNo} />
                    </div>

                    <Separator className="my-4" />
                    <h3 className="text-xl font-semibold mb-4">Academic & Work Information</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <DetailItem label="Academic Qualification" value={teacher.academicQualification} />
                        <DetailItem label="Professional Qualification" value={teacher.professionalQualification === 'Other' ? teacher.otherProfessionalQualification : teacher.professionalQualification} />
                        <DetailItem label="Area of Specialization" value={teacher.areaOfSpecialization} />
                        <DetailItem label="Rank" value={teacher.rank} />
                        <DetailItem label="Job" value={teacher.job} />
                        {teacher.job === 'Subject Teacher' && <DetailItem label="Subjects" value={teacher.subjects} />}
                        <DetailItem label="Leadership Position" value={teacher.leadershipPosition === 'Other' ? teacher.otherLeadershipPosition : teacher.leadershipPosition} />
                        <DetailItem label="Current School" value={getSchoolName(teacher.schoolId)} />
                        <DetailItem label="Previous School" value={teacher.previousSchool} />
                        <DetailItem label="First Appointment Date" value={teacher.firstAppointmentDate ? format(teacher.firstAppointmentDate, 'PPP') : null} />
                        <DetailItem label="Date Confirmed" value={teacher.dateConfirmed ? format(teacher.dateConfirmed, 'PPP') : null} />
                        <DetailItem label="Last Promotion Date" value={teacher.lastPromotionDate ? format(teacher.lastPromotionDate, 'PPP') : null} />
                        <DetailItem label="Date Posted To Current School" value={teacher.datePostedToCurrentSchool ? format(teacher.datePostedToCurrentSchool, 'PPP') : null} />
                        <DetailItem label="Teacher Union" value={teacher.teacherUnion} />
                    </div>

                    <Separator className="my-4" />
                    <h3 className="text-xl font-semibold mb-4">Bank and Salary Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <DetailItem label="Bank" value={teacher.bankName} />
                        <DetailItem label="Branch" value={teacher.bankBranch} />
                        <DetailItem label="Account Number" value={teacher.accountNumber} />
                        <DetailItem label="Salary Scale" value={teacher.salaryScale} />
                    </div>
                </CardContent>
            </Card>

            <TeacherForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                editingTeacher={teacher}
                setTeachers={setTeachers}
                schools={schools}
            />
        </div>
    );
}
