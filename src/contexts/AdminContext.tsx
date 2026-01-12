import React, { createContext, useContext, ReactNode } from 'react';
import { siteConfig } from '@/config/site';

export type AdminConfig = typeof siteConfig;

interface AdminContextType {
  config: AdminConfig;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AdminContext.Provider value={{ config: siteConfig }}>
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
