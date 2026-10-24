import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Users, 
  Sliders, 
  CalendarRange, 
  History, 
  Settings as SettingsIcon, 
  User as UserIcon,
  BookOpen,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  LogOut
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<Props> = ({ 
  isOpen, 
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  const { role, currentUser, logout } = useAuth();

  const teacherNavItems = [
    { name: 'แดชบอร์ดภาพรวม & ตารางส่งงาน', path: '/', icon: LayoutDashboard },
    { name: 'ส่งผลงานใหม่', path: '/submit', icon: UploadCloud, highlight: true },
    { name: 'รายการงานของฉัน', path: '/submissions', icon: FileText },
    { name: 'คลังเอกสาร & โฟลเดอร์งาน', path: '/library', icon: BookOpen },
    { name: 'โปรไฟล์ส่วนตัว', path: '/profile', icon: UserIcon },
  ];

  const adminNavItems = [
    { name: 'แดชบอร์ดผู้บริหาร & ฝ่ายตรวจ', path: '/', icon: LayoutDashboard },
    { name: 'จัดการหัวข้อส่งงาน & กำหนดส่ง', path: '/admin/topics', icon: FolderPlus, highlight: true },
    { name: 'งานส่งทั้งหมดในระบบ', path: '/submissions', icon: FileText },
    { name: 'จัดการสมาชิก & สิทธิ์', path: '/admin/members', icon: Users },
    { name: 'ประเภทงานที่เปิดรับ', path: '/admin/submission-types', icon: Sliders },
    { name: 'รอบการส่งงาน', path: '/admin/rounds', icon: CalendarRange },
    { name: 'คลังเอกสาร & โฟลเดอร์งาน', path: '/library', icon: BookOpen },
    { name: 'บันทึกประวัติ (Audit Logs)', path: '/admin/activity-logs', icon: History },
    { name: 'ตั้งค่าระบบ & เชื่อมต่อ Drive', path: '/admin/settings', icon: SettingsIcon },
    { name: 'โปรไฟล์ส่วนตัว', path: '/profile', icon: UserIcon },
  ];

  const navItems = role === 'admin' ? adminNavItems : teacherNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-16 bottom-0 left-0 z-40 bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 flex flex-col justify-between overflow-y-auto overflow-x-hidden`}
      >
        <div className={`space-y-4 ${isCollapsed ? 'p-2' : 'p-4'}`}>

          {/* User mini badge & Slide Toggle Button */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 pt-2 pb-1">
              {/* Replaced initial div with interactive slide expand toggle */}
              <button 
                onClick={onToggleCollapse}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-2xs cursor-pointer transition-all group hover:scale-105 ${
                  role === 'admin' 
                    ? 'bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200 hover:border-rose-600' 
                    : 'bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200 hover:border-emerald-600'
                }`}
                title={`${currentUser?.displayName || ''} (${role === 'admin' ? 'ฝ่ายตรวจงาน Admin' : 'คุณครู'}) - คลิกเพื่อขยายแถบเมนู (Ctrl+B)`}
                aria-label="ขยายแถบเมนู (Ctrl+B)"
              >
                <PanelLeftOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border flex-shrink-0 shadow-2xs ${
                  role === 'admin' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}>
                  {currentUser?.firstName?.substring(0, 1) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {role === 'admin' ? 'ฝ่ายตรวจงาน (Admin)' : 'คุณครู (Teacher)'}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 border border-transparent hover:border-slate-300 transition-colors flex-shrink-0 cursor-pointer"
                title="หุบแถบเมนู (Ctrl+B)"
                aria-label="หุบแถบเมนู"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                เมนูการทำงาน
              </p>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => onClose()}
                  title={item.name}
                  className={({ isActive }) => `
                    flex items-center rounded-xl text-xs font-medium transition-all group
                    ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'}
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold' 
                      : item.highlight
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 transition-transform group-hover:scale-110`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout & Footer Info */}
        <div className={`border-t border-slate-200/80 ${isCollapsed ? 'p-2' : 'p-3'} space-y-2 bg-slate-50/60`}>
          <button
            onClick={logout}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-transparent hover:border-rose-600 transition-all cursor-pointer group ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            }`}
            title="ออกจากระบบ"
            aria-label="Logout"
          >
            <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0 transition-transform group-hover:scale-110`} />
            {!isCollapsed && <span>ออกจากระบบ</span>}
          </button>

          {!isCollapsed && (
            <div className="text-center pt-1 border-t border-slate-200/50">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-medium">
                <Lock className="w-3 h-3 text-amber-500" />
                ไฟล์เข้าถึงได้เฉพาะแอดมิน
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
