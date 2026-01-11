import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AdminConfig {
  // Meta Tracking
  metaPixelId: string;
  headerCodeBlock: string;
  
  // Lead Event
  leadCapiAccessToken: string;
  leadCapiTestEventCode: string;
  leadCapiTestEnabled: boolean;
  
  // Submit Application Event
  applicationCapiAccessToken: string;
  applicationCapiTestEventCode: string;
  applicationCapiTestEnabled: boolean;
  
  // Integrations
  mailerLiteApiKey: string;
  mailerLiteGroupId: string;
  wistiaEmbedCode: string;
  calComBookingSlug: string;
  
  // Delays
  popupDelay: number;
  vslButtonDelay: number;
}

interface AdminContextType {
  config: AdminConfig;
  setConfig: (config: AdminConfig) => void;
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const defaultConfig: AdminConfig = {
  metaPixelId: '',
  headerCodeBlock: '',
  leadCapiAccessToken: '',
  leadCapiTestEventCode: '',
  leadCapiTestEnabled: false,
  applicationCapiAccessToken: '',
  applicationCapiTestEventCode: '',
  applicationCapiTestEnabled: false,
  mailerLiteApiKey: '',
  mailerLiteGroupId: '',
  wistiaEmbedCode: '',
  calComBookingSlug: 'the-first-time-ceo/strategy-session',
  popupDelay: 0,
  vslButtonDelay: 30,
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'executive_funnel_admin_config';
const AUTH_STORAGE_KEY = 'executive_funnel_admin_auth';
const ADMIN_PASSWORD = 'executive2024'; // In production, use proper auth

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<AdminConfig>(defaultConfig);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load config from localStorage
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        setConfigState({ ...defaultConfig, ...JSON.parse(storedConfig) });
      }
      
      const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load admin config:', error);
    }
  }, []);

  const setConfig = (newConfig: AdminConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save admin config:', error);
    }
  };

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AdminContext.Provider value={{ config, setConfig, isAuthenticated, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
