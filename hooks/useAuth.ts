'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Define types for user session
interface UserSession {
  UserId: number;
  Email: string;
  Name: string;
  RoleId: number;
  RoleName: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the user is logged in when the component mounts
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          // Not authenticated
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Error checking authentication status');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuthStatus();
  }, []);

  // Function to handle logout
  const logout = useCallback(async (redirectTo: string = '/') => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setUser(null);
        router.push(redirectTo);
      } else {
        setError('Error logging out');
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Error logging out');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.RoleName === 'Administrator' || user?.RoleName === 'Manager',
    isStaff: user?.RoleName === 'Cashier',
    isMember: user?.RoleName === 'Member',
    logout,
  };
} 