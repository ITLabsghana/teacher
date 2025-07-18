
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Teacher, School, LeaveRequest, User } from '@/lib/types';
import { supabase, getTeachers, getSchools, getLeaveRequests, getUsers, addTeacher as dbAddTeacher, updateTeacher as dbUpdateTeacher, deleteTeacher as dbDeleteTeacher, addSchool as dbAddSchool, updateSchool as dbUpdateSchool, deleteSchool as dbDeleteSchool, addLeaveRequest as dbAddLeaveRequest, updateLeaveRequest as dbUpdateLeaveRequest, addUser as dbAddUser, updateUser as dbUpdateUser, deleteUser as dbDeleteUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';


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
  
  // Exposed CRUD functions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (teacher: Teacher) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  addSchool: (school: Omit<School, 'id'>) => Promise<void>;
  updateSchool: (school: School) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status'>) => Promise<void>;
  updateLeaveRequest: (request: LeaveRequest) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teachersData, schoolsData, leaveRequestsData, usersData] = await Promise.all([
        getTeachers(),
        getSchools(),
        getLeaveRequests(),
        getUsers(),
      ]);
      setTeachers(teachersData);
      setSchools(schoolsData);
      setLeaveRequests(leaveRequestsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user ?? null;
      if (authUser) {
        if (!currentUser) { // Only fetch profile if not already set
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', authUser.id)
              .single();
            
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching user profile:', error);
              setCurrentUser(null);
            } else if (userProfile) {
                const wasNotLoggedIn = !currentUser;
                setCurrentUser(userProfile);
                await fetchData();
                if(wasNotLoggedIn) {
                    router.replace('/dashboard');
                }
            } else {
                setCurrentUser(null);
            }
        }
      } else {
        setCurrentUser(null);
        setTeachers([]);
        setSchools([]);
        setLeaveRequests([]);
        setUsers([]);
        router.replace('/');
      }
      if (isLoading) setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CRUD Implementations
  const handleAddTeacher = async (teacher: Omit<Teacher, 'id'>) => {
      await dbAddTeacher(teacher);
      setTeachers(await getTeachers());
  };
  const handleUpdateTeacher = async (teacher: Teacher) => {
      await dbUpdateTeacher(teacher);
      setTeachers(await getTeachers());
  };
  const handleDeleteTeacher = async (id: string) => {
      await dbDeleteTeacher(id);
      setTeachers(await getTeachers());
  };

  const handleAddSchool = async (school: Omit<School, 'id'>) => {
      await dbAddSchool(school);
      setSchools(await getSchools());
  };
  const handleUpdateSchool = async (school: School) => {
      await dbUpdateSchool(school);
      setSchools(await getSchools());
  };
  const handleDeleteSchool = async (id: string) => {
      await dbDeleteSchool(id);
      setSchools(await getSchools());
  };
  
  const handleAddLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>) => {
      await dbAddLeaveRequest(request);
      setLeaveRequests(await getLeaveRequests());
  };

  const handleUpdateLeaveRequest = async (request: LeaveRequest) => {
      await dbUpdateLeaveRequest(request);
      setLeaveRequests(await getLeaveRequests());
  };
  
  const handleAddUser = async (user: Omit<User, 'id'>) => {
      await dbAddUser(user);
      setUsers(await getUsers());
  };

  const handleUpdateUser = async (user: User) => {
      await dbUpdateUser(user);
      setUsers(await getUsers());
  };
  
  const handleDeleteUser = async (id: string) => {
      await dbDeleteUser(id);
      setUsers(await getUsers());
  };

  const value = {
    teachers, setTeachers,
    schools, setSchools,
    leaveRequests, setLeaveRequests,
    users, setUsers,
    currentUser, setCurrentUser,
    isLoading,
    addTeacher: handleAddTeacher,
    updateTeacher: handleUpdateTeacher,
    deleteTeacher: handleDeleteTeacher,
    addSchool: handleAddSchool,
    updateSchool: handleUpdateSchool,
    deleteSchool: handleDeleteSchool,
    addLeaveRequest: handleAddLeaveRequest,
    updateLeaveRequest: handleUpdateLeaveRequest,
    addUser: handleAddUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser
  };

  return (
    <DataContext.Provider value={value}>
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
