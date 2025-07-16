
"use client";

import { createContext, useContext, useState } from 'react';
import type { Teacher, School, LeaveRequest } from '@/lib/types';

// Mock data, in a real app this would come from a data store or API
const initialTeachers: Teacher[] = [];
const initialSchools: School[] = [];
const initialLeaveRequests: LeaveRequest[] = [];

interface DataContextProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);

  return (
    <DataContext.Provider value={{ teachers, setTeachers, schools, setSchools, leaveRequests, setLeaveRequests }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
