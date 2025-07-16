
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Teacher, School, LeaveRequest, User } from '@/lib/types';

const TEACHERS_KEY = 'teachersData';
const SCHOOLS_KEY = 'schoolsData';
const LEAVE_REQUESTS_KEY = 'leaveRequestsData';
const USERS_KEY = 'usersData';
const CURRENT_USER_KEY = 'currentUser';

const loadFromLocalStorage = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return null;
  }
};

const reviver = (key: string, value: any) => {
    if (key.toLowerCase().includes('date') && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

const loadWithDateReviver = (key: string) => {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item, reviver) : null;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return null;
    }
}


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

  useEffect(() => {
    const storedTeachers = loadWithDateReviver(TEACHERS_KEY) || [];
    const storedSchools = loadFromLocalStorage(SCHOOLS_KEY) || [];
    const storedLeaveRequests = loadWithDateReviver(LEAVE_REQUESTS_KEY) || [];
    let storedUsers = loadFromLocalStorage(USERS_KEY) || [];

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
      try {
        if (user) {
          window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        } else {
          window.localStorage.removeItem(CURRENT_USER_KEY);
        }
      } catch (error) {
          console.error("Failed to save current user to localStorage", error);
      }
    }
  };


  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
        } catch (error) {
          console.error("Failed to save teachers to localStorage", error);
        }
    }
  }, [teachers, isLoading]);

  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
        } catch (error) {
          console.error("Failed to save schools to localStorage", error);
        }
    }
  }, [schools, isLoading]);

  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(leaveRequests));
        } catch (error) {
          console.error("Failed to save leave requests to localStorage", error);
        }
    }
  }, [leaveRequests, isLoading]);

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
