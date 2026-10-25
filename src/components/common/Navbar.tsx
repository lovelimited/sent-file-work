import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getSettings } from '../../lib/storage';
import { 
  Bell, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  CheckCheck, 
  Shield,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  onToggleMobileSidebar: () => void;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export const Navbar: React.FC<Props> = ({ 
  onToggleMobileSidebar, 
  isMobileOpen,
  onToggleCollapse,
  isCollapsed
}) => {
  const { currentUser, role, logout } = useAuth();
  const settings = getSettings();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = currentUser ? getNotifications(currentUser.uid) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (currentUser) {
      markAllNotificationsAsRead(currentUser.uid);
      setShowNotifications(false);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'admin':
        return { label: 'ผู้ดูแลระบบและฝ่ายตรวจ (Admin)', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Shield };
      case 'teacher':
      default:
        return { label: 'คุณครูผู้ส่งงาน (Teacher)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap };
    }
  };

  const currentRoleInfo = getRoleBadge(role);
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 flex-shrink-0 glass-nav bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Toggle, Desktop Collapse Toggle & Brand */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Mobile Navigation"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>


          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full overflow-hidden shadow-sm border border-amber-200/80 flex-shrink-0 bg-white flex items-center justify-center p-0.5">
              <img 
                src="/logo.jpg" 
                alt="School Logo" 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                {settings.schoolName}
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                {settings.systemName}
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Authenticated User Role Badge */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs ${currentRoleInfo.color}`}
            title={`สิทธิ์การใช้งาน: ${currentRoleInfo.label}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{currentRoleInfo.label}</span>
            <span className="md:hidden capitalize">{role === 'admin' ? 'ฝ่ายตรวจ (Admin)' : 'คุณครู (Teacher)'}</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
              aria-label="แจ้งเตือน"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">การแจ้งเตือน</h3>
                    <p className="text-xs text-slate-500">ยังไม่ได้อ่าน {unreadCount} รายการ</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      ไม่มีการแจ้งเตือนใหม่ในขณะนี้
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-semibold ${!n.read ? 'text-blue-900' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                          {new Date(n.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <img
                src={currentUser?.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={currentUser?.displayName}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
              />
              <span className="hidden lg:block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {currentUser?.displayName || 'ผู้ใช้งาน'}
              </span>
            </button>

            {/* Profile Dropdown */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  จัดการโปรไฟล์ส่วนตัว
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
