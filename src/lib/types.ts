export interface Teacher {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender: 'Male' | 'Female';
  registeredNo?: string;
  ghanaCardNo?: string;
  ssnitNo?: string;
  tinNo?: string;
  phoneNo?: string;
  homeTown?: string;
  email?: string;
  address?: string;
  academicQualification?: string;
  professionalQualification?: string;
  otherProfessionalQualification?: string;
  rank?: string;
  job?: 'Head Teacher' | 'Class Teacher' | 'Subject Teacher';
  subjects?: string;
  leadershipPosition?: string;
  otherLeadershipPosition?: string;
  areaOfSpecialization?: string;
  lastPromotionDate?: Date;
  previousSchool?: string;
  schoolId?: string;
  datePostedToCurrentSchool?: Date;
  licensureNo?: string;
  firstAppointmentDate?: Date;
  dateConfirmed?: Date;
  teacherUnion?: string;
  photo?: string | null; // URL of the uploaded photo
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  salaryScale?: string;
  documents?: { name: string; url: string; }[];
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
