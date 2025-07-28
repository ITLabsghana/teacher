
"use client";

import { createContext, useContext, useEffect, ReactNode, useReducer, useCallback } from 'react';
import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { createUserAction, deleteUserAction, updateUserAction } from '@/app/actions/user-actions';

// --- State and Reducer ---

interface AppState {
  currentUser: User | null;
  isLoading: boolean;
}

const initialState: AppState = {
  currentUser: null,
  isLoading: true,
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'CLEAR_LOCAL_DATA' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload, isLoading: false };
    case 'CLEAR_LOCAL_DATA':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// --- Context Definition ---

interface DataContextProps extends AppState {
  logout: () => Promise<void>;
  clearLocalData: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (user: User) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
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
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (_event === 'SIGNED_OUT') {
          clearLocalData();
        } else if ((_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') && session) {
          const { data: userProfile } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
          dispatch({ type: 'SET_CURRENT_USER', payload: userProfile });
        }
      });
      return () => authListener.subscription.unsubscribe();
    };
    getSessionAndListen();
  }, [clearLocalData]);


  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: DataContextProps = {
    ...state,
    logout,
    clearLocalData,
    addUser: createUserAction,
    updateUser: updateUserAction,
    deleteUser: deleteUserAction,
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
