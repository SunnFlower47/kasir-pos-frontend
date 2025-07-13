import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed

  // Set sidebar open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;

      if (isDesktop) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Remove sidebarOpen dependency to prevent loop



  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-500 ease-in-out ${
        sidebarOpen ? 'md:ml-64 lg:ml-72' : 'md:ml-16 lg:ml-20'
      }`}>
        {/* Header */}
        <Header onMenuClick={() => {
          try {
            setSidebarOpen(!sidebarOpen);
          } catch (error) {
            console.warn('🔇 Header toggle error suppressed:', error);
          }
        }} />

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-transparent">
          <div className="py-3 md:py-4 lg:py-6">
            <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-6 xl:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
