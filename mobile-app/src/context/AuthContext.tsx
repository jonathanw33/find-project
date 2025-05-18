import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setUser, 
  setLoading, 
  setError, 
  logout as logoutAction,
  updateUserProfile
} from '../redux/slices/authSlice';
import { RootState } from '../redux/store';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Supabase client
const supabaseUrl = 'https://hxdurjngbkfnbryzczau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: global.fetch, // Use the fetch with the timeout we set in App.tsx
    headers: {
      'X-Client-Info': 'react-native-v2.39.7',
    }
  },
  // Disable realtime subscriptions to avoid WebSocket issues
  realtime: {
    params: {
      eventsPerSecond: 0, // Disable realtime completely
    },
  },
});

interface AuthContextType {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Set loading state to true while we check for an existing session
    dispatch(setLoading(true));
    
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (session?.user) {
        dispatch(setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        }));
      } else {
        // No session, so ensure user is logged out
        dispatch(logoutAction());
      }
      
      // Only set loading to false after we've processed the auth state
      dispatch(setLoading(false));
    });

    // Initial session check - the loading state will be updated by the onAuthStateChange listener
    checkUser();

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only directly update user state if we have a session
      // Otherwise, let the onAuthStateChange handler handle it
      if (session?.user) {
        dispatch(setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        }));
        
        // We've set the user, but let the auth state change listener handle setting loading to false
      } else {
        // No session found, explicitly set loading to false in case the auth state change event doesn't fire
        setTimeout(() => {
          dispatch(setLoading(false));
        }, 500);  // Short delay to let any pending auth state changes process first
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      dispatch(setError((error as Error).message));
      dispatch(setLoading(false));
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const signOut = async () => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch(logoutAction());
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateProfile = async (updates: { name?: string; avatarUrl?: string }) => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
          avatar_url: updates.avatarUrl,
        },
      });
      
      if (error) throw error;
      dispatch(updateUserProfile(updates));
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};