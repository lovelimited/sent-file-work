import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sent_work_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sent_work_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Navbar 
        onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} 
        isMobileOpen={isMobileOpen}
        onToggleCollapse={toggleCollapse}
        isCollapsed={isCollapsed}
      />

      <div className="flex-1 flex relative w-full min-w-0 overflow-x-hidden pt-16">
        <Sidebar 
          isOpen={isMobileOpen} 
          onClose={() => setIsMobileOpen(false)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Main Content Area - Expands when Sidebar is Collapsed */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          <div className="w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
