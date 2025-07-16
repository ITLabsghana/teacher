
export interface Teacher {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
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
  photo?: string; // as a data URI
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  salaryScale?: string;
  documents?: { name: string; url: string; }[];
}

export interface School {
  id: string;
  name: string;
  category: 'KG1' | 'KG2' | 'Basic 1-6' | 'J.H.S 1-3' | 'S.H.S 1-3';
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  leaveType: 'Sick' | 'Vacation' | 'Personal' | 'Other';
  startDate: Date;
  returnDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Viewer';
}
