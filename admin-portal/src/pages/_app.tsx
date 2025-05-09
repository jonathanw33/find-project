import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Define routes that don't require authentication
const publicRoutes = ['/login'];

// Component to handle authentication routing logic
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Allow access to public routes
      if (publicRoutes.includes(router.pathname)) {
        // If user is already logged in, redirect to dashboard
        if (user) {
          router.push('/dashboard');
        }
      } else {
        // Protected route - redirect to login if not authenticated
        if (!user) {
          router.push('/login');
        } else if (!isAdmin) {
          // If not an admin user, redirect to login
          router.push('/login');
        }
      }
      setIsReady(true);
    }
  }, [user, isLoading, isAdmin, router]);

  // Show nothing while checking auth state
  if (!isReady || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-primary-600"></div>
      </div>
    );
  }

  // Public route or authenticated user with admin rights
  return <>{children}</>;
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Component {...pageProps} />
      </AuthWrapper>
    </AuthProvider>
  );
}

export default MyApp;