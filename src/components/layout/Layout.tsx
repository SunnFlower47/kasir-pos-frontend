import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useFullscreen } from '../../contexts/FullscreenContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed
  const { isFullscreen } = useFullscreen();
  const location = useLocation();

  // Check if current route is POS
  const isPOSRoute = location.pathname.includes('/pos') || location.pathname.includes('/kasir');

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
      {/* Sidebar - Hidden in fullscreen mode */}
      {!isFullscreen && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}

      {/* Main content */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-500 ease-in-out ${
        isFullscreen ? '' : (sidebarOpen ? 'md:ml-64 lg:ml-72' : 'md:ml-16 lg:ml-20')
      }`}>
        {/* Header - Hidden in fullscreen mode */}
        {!isFullscreen && (
          <Header 
            onMenuClick={() => {
              try {
                setSidebarOpen(!sidebarOpen);
              } catch (error) {
                console.warn('🔇 Header toggle error suppressed:', error);
              }
            }}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => {
              try {
                setSidebarOpen(false);
              } catch (error) {
                console.warn('🔇 Header close error suppressed:', error);
              }
            }}
          />
        )}

        {/* Main content area */}
        <main className="flex-1 relative overflow-hidden focus:outline-none bg-transparent">
          {isPOSRoute ? (
            // POS interface gets full area without padding/margins
            <div className="h-full">
              <Outlet />
            </div>
          ) : (
            // Regular pages get normal layout with padding
            <div className="py-3 md:py-4 lg:py-6 h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-6 xl:px-8">
                <Outlet />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
