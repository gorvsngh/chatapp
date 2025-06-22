import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';

interface MobileContextType {
  isMobile: boolean;
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};

interface MobileProviderProps {
  children: React.ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Determine if we're on mobile based on screen size
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
      setShowChat(false);
    }
  }, [isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
          setIsSidebarOpen(false);
        }
      }
    };

    if (isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isSidebarOpen]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const value: MobileContextType = {
    isMobile,
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    showChat,
    setShowChat,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}; 