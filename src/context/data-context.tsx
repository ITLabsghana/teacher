
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Teacher, School, LeaveRequest, User } from '@/lib/types';

// Keys for localStorage
const TEACHERS_KEY = 'teachersData';
const SCHOOLS_KEY = 'schoolsData';
const LEAVE_REQUESTS_KEY = 'leaveRequestsData';
const USERS_KEY = 'usersData';
const CURRENT_USER_KEY = 'currentUser';

// Helper function to load data from localStorage
const loadFromLocalStorage = (key: string, isDateHeavy: boolean = false) => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return key === USERS_KEY ? [] : null; // Return empty array for users if not found
    
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
    return key === USERS_KEY ? [] : null;
  }
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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial client-side render
  useEffect(() => {
    const storedTeachers = loadFromLocalStorage(TEACHERS_KEY, true) || [];
    const storedSchools = loadFromLocalStorage(SCHOOLS_KEY) || [];
    const storedLeaveRequests = loadFromLocalStorage(LEAVE_REQUESTS_KEY, true) || [];
    let storedUsers = loadFromLocalStorage(USERS_KEY) || [];

    // Seed initial admin user if no users exist
    if (storedUsers.length === 0) {
      const adminUser: User = {
        id: crypto.randomUUID(),
        username: 'Prof',
        email: 'admin@example.com',
        password: 'Incre@com0248',
        role: 'Admin',
      };
      storedUsers = [adminUser];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
      }
    }

    setTeachers(storedTeachers);
    setSchools(storedSchools);
    setLeaveRequests(storedLeaveRequests);
    setUsers(storedUsers);
    _setCurrentUser(loadFromLocalStorage(CURRENT_USER_KEY));

    setIsLoading(false);
  }, []);

  const setCurrentUser = (user: User | null) => {
    _setCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
  };


  // Effect to save teachers to localStorage
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
        } catch (error) {
          console.error("Failed to save teachers to localStorage", error);
        }
    }
  }, [teachers, isLoading]);

  // Effect to save schools to localStorage
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
        } catch (error) {
          console.error("Failed to save schools to localStorage", error);
        }
    }
  }, [schools, isLoading]);

  // Effect to save leave requests to localStorage
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(leaveRequests));
        } catch (error) {
          console.error("Failed to save leave requests to localStorage", error);
        }
    }
  }, [leaveRequests, isLoading]);

  // Effect to save users to localStorage
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (error) {
          console.error("Failed to save users to localStorage", error);
        }
    }
  }, [users, isLoading]);


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
