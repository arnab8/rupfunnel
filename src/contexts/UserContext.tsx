import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserData {
  fullName: string;
  email: string;
  phone: string;
  jobRole: string;
  utmCampaign?: string;
  utmContent?: string;
  fbp?: string;
  fbc?: string;
}

interface UserContextType {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  clearUserData: () => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'executive_funnel_user';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUserDataState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
    setIsLoaded(true);
  }, []);

  const setUserData = (data: UserData) => {
    setUserDataState(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const clearUserData = () => {
    setUserDataState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, clearUserData, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
