
"use client";

import { createContext, useContext, useEffect, ReactNode, useReducer, useCallback } from 'react';
import type { Teacher, School, LeaveRequest, User } from '@/lib/types';
import { supabase, getTeachers, getSchools, getLeaveRequests, getUsers, addTeacher as dbAddTeacher, updateTeacher as dbUpdateTeacher, deleteTeacher as dbDeleteTeacher, addSchool as dbAddSchool, updateSchool as dbUpdateSchool, deleteSchool as dbDeleteSchool, addLeaveRequest as dbAddLeaveRequest, updateLeaveRequest as dbUpdateLeaveRequest } from '@/lib/supabase';
import { createUserAction, updateUserAction, deleteUserAction } from '@/app/actions/user-actions';

// --- State and Reducer ---

interface AppState {
  teachers: Teacher[];
  schools: School[];
  leaveRequests: LeaveRequest[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  isDataLoaded: boolean;
}

const initialState: AppState = {
  teachers: [],
  schools: [],
  leaveRequests: [],
  users: [],
  currentUser: null,
  isLoading: true,
  isDataLoaded: false,
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_ALL_DATA'; payload: { teachers: Teacher[]; schools: School[]; leaveRequests: LeaveRequest[]; users: User[] } }
  | { type: 'SET_TEACHERS'; payload: Teacher[] }
  | { type: 'ADD_TEACHER'; payload: Teacher }
  | { type: 'UPDATE_TEACHER'; payload: Teacher }
  | { type: 'DELETE_TEACHER'; payload: string }
  | { type: 'SET_SCHOOLS'; payload: School[] }
  | { type: 'ADD_SCHOOL'; payload: School }
  | { type: 'UPDATE_SCHOOL'; payload: School }
  | { type: 'DELETE_SCHOOL'; payload: string }
  | { type: 'SET_LEAVE_REQUESTS'; payload: LeaveRequest[] }
  | { type: 'ADD_LEAVE_REQUEST'; payload: LeaveRequest }
  | { type: 'UPDATE_LEAVE_REQUEST'; payload: LeaveRequest }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'CLEAR_LOCAL_DATA' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_ALL_DATA':
      return { ...state, ...action.payload, isDataLoaded: true, isLoading: false };
    case 'SET_TEACHERS':
      return { ...state, teachers: action.payload };
    case 'ADD_TEACHER':
      return { ...state, teachers: [action.payload, ...state.teachers] };
    case 'UPDATE_TEACHER':
      return { ...state, teachers: state.teachers.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TEACHER':
      return { ...state, teachers: state.teachers.filter(t => t.id !== action.payload) };
    case 'SET_SCHOOLS':
        return { ...state, schools: action.payload };
    case 'ADD_SCHOOL':
        return { ...state, schools: [...state.schools, action.payload] };
    case 'UPDATE_SCHOOL':
        return { ...state, schools: state.schools.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SCHOOL':
        return { ...state, schools: state.schools.filter(s => s.id !== action.payload) };
    case 'SET_LEAVE_REQUESTS':
        return { ...state, leaveRequests: action.payload };
    case 'ADD_LEAVE_REQUEST':
        return { ...state, leaveRequests: [action.payload, ...state.leaveRequests] };
    case 'UPDATE_LEAVE_REQUEST':
        return { ...state, leaveRequests: state.leaveRequests.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'SET_USERS':
        return { ...state, users: action.payload };
    case 'ADD_USER':
        return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
        return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'DELETE_USER':
        return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'CLEAR_LOCAL_DATA':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// --- Context Definition ---

interface DataContextProps extends AppState {
  setTeachers: (teachers: Teacher[]) => void;
  setSchools: (schools: School[]) => void;
  setLeaveRequests: (leaveRequests: LeaveRequest[]) => void;
  setUsers: (users: User[]) => void;
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
  logout: () => Promise<void>;
  clearLocalData: () => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

// --- Provider Component ---

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const clearLocalData = useCallback(() => {
    dispatch({ type: 'CLEAR_LOCAL_DATA' });
  }, []);

  // Effect for handling authentication state changes
  useEffect(() => {
    const getSessionAndListen = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: userProfile } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
        dispatch({ type: 'SET_CURRENT_USER', payload: userProfile });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (_event === 'SIGNED_OUT') {
          clearLocalData();
        } else if (_event === 'SIGNED_IN' && session) {
          const { data: userProfile } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
          dispatch({ type: 'SET_CURRENT_USER', payload: userProfile });
        }
      });
      return () => authListener.subscription.unsubscribe();
    };
    getSessionAndListen();
  }, [clearLocalData]);

  // Effect for fetching all application data once a user is logged in
  useEffect(() => {
    const fetchData = async () => {
      if (state.currentUser && !state.isDataLoaded) {
        try {
          const [teachers, schools, leaveRequests, users] = await Promise.all([
            getTeachers(), getSchools(), getLeaveRequests(), getUsers(),
          ]);
          dispatch({ type: 'SET_ALL_DATA', payload: { teachers, schools, leaveRequests, users } });
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };
    fetchData();
  }, [state.currentUser, state.isDataLoaded]);

  // --- CRUD Actions ---

  const setTeachers = (teachers: Teacher[]) => dispatch({ type: 'SET_TEACHERS', payload: teachers });
  const setSchools = (schools: School[]) => dispatch({ type: 'SET_SCHOOLS', payload: schools });
  const setLeaveRequests = (requests: LeaveRequest[]) => dispatch({ type: 'SET_LEAVE_REQUESTS', payload: requests });
  const setUsers = (users: User[]) => dispatch({ type: 'SET_USERS', payload: users });

  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher = await dbAddTeacher(teacher);
    dispatch({ type: 'ADD_TEACHER', payload: newTeacher });
  };
  
  const updateTeacher = async (teacher: Teacher) => {
    console.log('[DataContext] updateTeacher called with:', teacher);
    const updatedTeacher = await dbUpdateTeacher(teacher);
    dispatch({ type: 'UPDATE_TEACHER', payload: updatedTeacher });
    console.log('[DataContext] Teacher update complete.');
  };
  
  const deleteTeacher = async (id: string) => {
    await dbDeleteTeacher(id);
    dispatch({ type: 'DELETE_TEACHER', payload: id });
  };
  
  const addSchool = async (school: Omit<School, 'id'>) => {
    const newSchool = await dbAddSchool(school);
    dispatch({ type: 'ADD_SCHOOL', payload: newSchool });
  };

  const updateSchool = async (school: School) => {
    const updatedSchool = await dbUpdateSchool(school);
    dispatch({ type: 'UPDATE_SCHOOL', payload: updatedSchool });
  };

  const deleteSchool = async (id: string) => {
    await dbDeleteSchool(id);
    dispatch({ type: 'DELETE_SCHOOL', payload: id });
  };

  const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newRequest = await dbAddLeaveRequest(request);
    dispatch({ type: 'ADD_LEAVE_REQUEST', payload: newRequest });
  };

  const updateLeaveRequest = async (request: LeaveRequest) => {
    const updatedRequest = await dbUpdateLeaveRequest(request);
    dispatch({ type: 'UPDATE_LEAVE_REQUEST', payload: updatedRequest });
  };
  
  const addUser = async (user: Omit<User, 'id'>) => {
      const newUser = await createUserAction(user);
      dispatch({ type: 'ADD_USER', payload: newUser });
  };

  const updateUser = async (user: User) => {
      const updatedUser = await updateUserAction(user);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  };
  
  const deleteUser = async (id: string) => {
      await deleteUserAction(id);
      dispatch({ type: 'DELETE_USER', payload: id });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: DataContextProps = {
    ...state,
    setTeachers, setSchools, setLeaveRequests, setUsers,
    addTeacher, updateTeacher, deleteTeacher,
    addSchool, updateSchool, deleteSchool,
    addLeaveRequest, updateLeaveRequest,
    addUser, updateUser, deleteUser,
    logout, clearLocalData
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
