import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';
import { getSettings } from '../../lib/storage';

export const AppLayout: React.FC = () => {
  const settings = getSettings();
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
        <main className={`flex-1 min-w-0 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          <div className="w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 min-w-0 flex-1">
            <Outlet />
          </div>

          {/* Global Footer Credit */}
          <footer className="mt-auto py-3.5 px-6 sm:px-8 border-t border-slate-200/80 bg-white/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <p>© 2569 {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'} • ระบบส่งงานครูและตรวจประเมินวิชาการ</p>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">พัฒนาระบบโดย</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                ม.กฤตพจน์  แก้วกา
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
