import { notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, File as FileIcon } from 'lucide-react';
import { format, differenceInYears, isWithinInterval } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { TeacherForm } from '@/components/dashboard/teacher-form';
import { getTeacherById, getSchools, getLeaveRequests, deleteTeacher } from '@/lib/supabase';
import type { Teacher, School, LeaveRequest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { TeacherProfileClientPage } from './client-page';

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{String(value)}</p>
        </div>
    );
}

function getInitials(firstName?: string, lastName?: string) {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
};

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
    const [teacher, schools, leaveRequests] = await Promise.all([
        getTeacherById(params.id),
        getSchools('id,name'),
        getLeaveRequests(),
    ]);

    if (!teacher) {
        notFound();
    }

    const isOnLeave = leaveRequests.some(req =>
        req.teacherId === teacher.id &&
        req.status === 'Approved' &&
        req.startDate && req.returnDate &&
        isWithinInterval(new Date(), {
            start: req.startDate,
            end: req.returnDate
        })
    );

    const getSchoolName = (schoolId?: string | null) => {
        if (!schoolId) return 'N/A';
        return (schools as School[]).find(s => s.id === schoolId)?.name || 'N/A';
    };

    const yearsInCurrentSchool = teacher.datePostedToCurrentSchool ? differenceInYears(new Date(), teacher.datePostedToCurrentSchool) : null;
    const subheaderDetails = [
        teacher.job, 
        teacher.areaOfSpecialization,
        yearsInCurrentSchool !== null ? `${yearsInCurrentSchool} year(s) in current school` : null
    ];
    const subheader = subheaderDetails.filter(Boolean).join(' | ');

    return (
        <TeacherProfileClientPage
            teacher={teacher}
            schools={schools as School[]}
            initialLeaveRequests={leaveRequests}
            initialIsOnLeave={isOnLeave}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-6">
                            <Avatar className="h-40 w-40">
                                <AvatarImage src={teacher.photo ?? undefined} alt={`${teacher.firstName} ${teacher.lastName}`} />
                                <AvatarFallback className="text-5xl">{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-4">
                                    <CardTitle className="text-4xl">{teacher.firstName} {teacher.lastName}</CardTitle>
                                    {isOnLeave && <Badge className="bg-destructive text-destructive-foreground">On Leave</Badge>}
                                </div>
                                <CardDescription className="text-lg">{subheader}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Separator className="my-4" />
                        <h3 className="text-xl font-semibold mb-4">Identification</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            <DetailItem label="Staff ID" value={teacher.staffId} />
                            <DetailItem label="Registered No." value={teacher.registeredNo} />
                            <DetailItem label="Ghana Card No." value={teacher.ghanaCardNo} />
                            <DetailItem label="SSNIT No." value={teacher.ssnitNo} />
                            <DetailItem label="TIN No." value={teacher.tinNo} />
                            <DetailItem label="Licensure No." value={teacher.licensureNo} />
                        </div>

                        <Separator className="my-4" />
                        <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            <DetailItem label="Date of Birth" value={teacher.dateOfBirth ? format(teacher.dateOfBirth, 'PPP') : null} />
                            <DetailItem label="Age" value={teacher.dateOfBirth ? differenceInYears(new Date(), teacher.dateOfBirth) : null} />
                            <DetailItem label="Gender" value={teacher.gender} />
                            <DetailItem label="Email" value={teacher.email} />
                            <DetailItem label="Phone No." value={teacher.phoneNo} />
                            <DetailItem label="Address" value={teacher.address} />
                            <DetailItem label="Home Town" value={teacher.homeTown} />
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

                        {teacher.documents && teacher.documents.length > 0 && (
                            <>
                                <Separator className="my-4" />
                                <h3 className="text-xl font-semibold mb-4">Uploaded Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teacher.documents.map((doc, index) => (
                                        <a
                                            key={index}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 border rounded-md hover:bg-secondary"
                                        >
                                            <FileIcon className="h-5 w-5 text-primary" />
                                            <span className="truncate font-medium">{doc.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TeacherProfileClientPage>
    );
}
