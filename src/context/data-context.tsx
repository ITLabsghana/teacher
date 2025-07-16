
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Teacher, School, LeaveRequest } from '@/lib/types';

// Keys for localStorage
const TEACHERS_KEY = 'teachersData';
const SCHOOLS_KEY = 'schoolsData';
const LEAVE_REQUESTS_KEY = 'leaveRequestsData';

// Helper function to load data from localStorage
const loadFromLocalStorage = (key: string, isDateHeavy: boolean = false) => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return [];
    
    const data = JSON.parse(item);
    
    // For data structures with dates, we need to convert strings back to Date objects.
    if (isDateHeavy && Array.isArray(data)) {
        if (key === TEACHERS_KEY) {
            return data.map((t: Teacher) => ({
                ...t,
                dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : new Date(),
                lastPromotionDate: t.lastPromotionDate ? new Date(t.lastPromotionDate) : undefined,
                datePostedToCurrentSchool: t.datePostedToCurrentSchool ? new Date(t.datePostedToCurrentSchool) : undefined,
                firstAppointmentDate: t.firstAppointmentDate ? new Date(t.firstAppointmentDate) : undefined,
                dateConfirmed: t.dateConfirmed ? new Date(t.dateConfirmed) : undefined,
            }));
        }
        if (key === LEAVE_REQUESTS_KEY) {
            return data.map((lr: LeaveRequest) => ({
                ...lr,
                startDate: lr.startDate ? new Date(lr.startDate) : new Date(),
                returnDate: lr.returnDate ? new Date(lr.returnDate) : new Date(),
            }));
        }
    }
    
    return data;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return [];
  }
};


interface DataContextProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial client-side render
  useEffect(() => {
    setTeachers(loadFromLocalStorage(TEACHERS_KEY, true));
    setSchools(loadFromLocalStorage(SCHOOLS_KEY));
    setLeaveRequests(loadFromLocalStorage(LEAVE_REQUESTS_KEY, true));
    setIsLoading(false);
  }, []);


  // Effect to save teachers to localStorage
  useEffect(() => {
    if (!isLoading) {
        try {
          window.localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
        } catch (error) {
          console.error("Failed to save teachers to localStorage", error);
        }
    }
  }, [teachers, isLoading]);

  // Effect to save schools to localStorage
  useEffect(() => {
    if (!isLoading) {
        try {
          window.localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
        } catch (error) {
          console.error("Failed to save schools to localStorage", error);
        }
    }
  }, [schools, isLoading]);

  // Effect to save leave requests to localStorage
  useEffect(() => {
    if (!isLoading) {
        try {
          window.localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(leaveRequests));
        } catch (error) {
          console.error("Failed to save leave requests to localStorage", error);
        }
    }
  }, [leaveRequests, isLoading]);


  return (
    <DataContext.Provider value={{ teachers, setTeachers, schools, setSchools, leaveRequests, setLeaveRequests, isLoading }}>
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
