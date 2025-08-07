export interface Teacher {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  gender: 'Male' | 'Female' | null;
  registeredNo?: string | null;
  ghanaCardNo?: string | null;
  ssnitNo?: string | null;
  tinNo?: string | null;
  phoneNo?: string | null;
  homeTown?: string | null;
  email?: string | null;
  address?: string | null;
  academicQualification?: string | null;
  professionalQualification?: string | null;
  otherProfessionalQualification?: string | null;
  rank?: string | null;
  job?: 'Head Teacher' | 'Class Teacher' | 'Subject Teacher' | null;
  subjects?: string | null;
  leadershipPosition?: string | null;
  otherLeadershipPosition?: string | null;
  areaOfSpecialization?: string | null;
  lastPromotionDate?: Date | null;
  previousSchool?: string | null;
  schoolId?: string | null;
  datePostedToCurrentSchool?: Date | null;
  licensureNo?: string | null;
  firstAppointmentDate?: Date | null;
  dateConfirmed?: Date | null;
  teacherUnion?: string | null;
  photo?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumber?: string | null;
  salaryScale?: string | null;
  documents?: { name: string; url: string; }[] | null;
}

export interface School {
  id: string;
  name: string;
  enrollment?: { [className: string]: { boys: number; girls: number } };
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  leaveType: 'Study Leave (with pay)' | 'Study Leave (without pay)' | 'Sick' | 'Maternity' | 'Paternity' | 'Casual' | 'Other';
  startDate: Date;
  returnDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Supervisor' | 'Viewer';
  auth_id?: string;
}
