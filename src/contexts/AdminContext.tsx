import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServerConfig } from '@/types/config';

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
  calComWhatsAppFieldIdentifier: string;
  
  // Thumbnail
  homeThumbnailUrl: string;
  
  // Delays
  popupDelay: number;
  vslButtonDelay: number;

  // External CRM ID
  enableExternalIdField: boolean;
  externalIdFieldLabel: string;
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
  calComWhatsAppFieldIdentifier: '',
  homeThumbnailUrl: '', // Add thumbnail URL
  popupDelay: 30, // Show popup after 30 seconds (configurable in Admin panel)
  vslButtonDelay: parseInt(import.meta.env.VITE_VSL_BUTTON_DELAY || '30'),

  // External CRM ID
  enableExternalIdField: false,
  externalIdFieldLabel: 'External CRM ID (optional)',
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'executive_funnel_admin_config';
const AUTH_STORAGE_KEY = 'executive_funnel_admin_auth';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'executive2024';

interface AdminProviderProps {
  children: ReactNode;
  initialServerConfig?: ServerConfig;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ 
  children, 
  initialServerConfig 
}) => {
  const [config, setConfigState] = useState<AdminConfig>(defaultConfig);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load config from localStorage (admin overrides)
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      let loadedConfig = defaultConfig;
      
      if (storedConfig) {
        loadedConfig = { ...defaultConfig, ...JSON.parse(storedConfig) };
      }
      
      // Merge server config (server config is read-only reference)
      if (initialServerConfig) {
        loadedConfig = {
          ...loadedConfig,
          metaPixelId: initialServerConfig.metaPixelId || loadedConfig.metaPixelId,
          headerCodeBlock: initialServerConfig.headerCodeBlock || loadedConfig.headerCodeBlock,
          mailerLiteGroupId: initialServerConfig.mailerLiteGroupId || loadedConfig.mailerLiteGroupId,
          wistiaEmbedCode: initialServerConfig.wistiaEmbedCode || loadedConfig.wistiaEmbedCode,
          calComBookingSlug: initialServerConfig.calComBookingSlug || loadedConfig.calComBookingSlug,
          homeThumbnailUrl: initialServerConfig.homeThumbnailUrl || loadedConfig.homeThumbnailUrl,
        };
      }
      
      setConfigState(loadedConfig);
      
      const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load admin config:', error);
    }
  }, [initialServerConfig]);

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
