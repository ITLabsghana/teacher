export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  schoolId: string;
  subject: string;
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
