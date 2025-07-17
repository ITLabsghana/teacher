
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Teacher, School, LeaveRequest, User } from '@/lib/types';

const defaultAdminUser: User = {
    id: 'default-admin',
    username: 'Prof',
    email: 'admin@example.com',
    password: 'Incre@com0248',
    role: 'Admin',
};

interface DataContextProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([defaultAdminUser]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Data is now in-memory, no loading needed.

  return (
    <DataContext.Provider value={{ teachers, setTeachers, schools, setSchools, leaveRequests, setLeaveRequests, users, setUsers, currentUser, setCurrentUser, isLoading }}>
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
