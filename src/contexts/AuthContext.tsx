import { useReducer, useEffect, type ReactNode } from 'react';
import type { AuthContextType, AuthState, User, LoginCredentials, RegisterData } from '../types/auth';
import { authService } from '../services/authService';
import { AuthContext } from './AuthContext';

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      // No existing session
      console.log('No existing session %s',error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const user = await authService.login(credentials);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const user = await authService.register(data);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const loginWithLinkedIn = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      // This will redirect to LinkedIn OAuth
      await authService.loginWithLinkedIn();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LinkedIn login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.log('Logout failed %s',error);
      // Even if logout fails, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    loginWithLinkedIn,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 

export { AuthContext };
