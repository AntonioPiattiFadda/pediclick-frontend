import { supabase } from '@/service';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';


interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type?: 'buyer' | 'seller';
  business_name?: string;
  tax_id?: string;
  address?: any;
  phone?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, loading: false, user: action.payload, error: null };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'AUTH_LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);


const signIn = async (email: string, password: string) => {
  dispatch({ type: 'AUTH_START' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return;
    }

    if (!data.session || !data.user) {
      dispatch({ type: 'AUTH_ERROR', payload: 'No session or user returned' });
      return;
    }

    const currentUser: User = {
      id: data.user.id,
      email: data.user.email || '',
      full_name: data.user.user_metadata.full_name || '', // Si tienes este campo en user_metadata
      user_type: data.user.user_metadata.user_type || 'buyer', // Ajusta según tu metadata
    };

    dispatch({ type: 'AUTH_SUCCESS', payload: currentUser });

    window.location.href = '/dashboard'; // Redirigir al inicio después de iniciar sesión

  } catch (error: any) {
    dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Unknown error' });
  }
};

  const signUp = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '2',
      email,
    };
    
    dispatch({ type: 'AUTH_SUCCESS', payload: mockUser });
  };

  const signOut = async () => {
    dispatch({ type: 'AUTH_START' });
    await new Promise(resolve => setTimeout(resolve, 500));
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const forgotPassword = async (email: string) => {
    dispatch({ type: 'AUTH_START' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock success - in real app would send email
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const resetPassword = async (token: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock success
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateProfile = async (profileData: Partial<User>) => {
    dispatch({ type: 'AUTH_START' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser = { ...state.user!, ...profileData };
    dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      updateProfile,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
