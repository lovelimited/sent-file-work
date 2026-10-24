import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../lib/storage';
import { LogIn, Shield, GraduationCap, Award, Lock, Mail, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, switchRole } = useAuth();
  const settings = getSettings();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('drive.limited@gmail.com');
  const [password, setPassword] = useState('krittapot001');
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      Swal.fire({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: res.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (res.success) {
      navigate('/');
    }
  };

  const handleQuickDemoLogin = (role: 'teacher' | 'admin') => {
    switchRole(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95">

        {/* Logo & School Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full mx-auto overflow-hidden shadow-md border-2 border-amber-200/80 bg-white flex items-center justify-center p-1">
            <img 
              src="/logo.jpg" 
              alt="School Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              ปีการศึกษา {settings.academicYear}/{settings.semester}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              {settings.schoolName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.systemName}
            </p>
          </div>
        </div>

        {/* Main Login Form */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมลสถานศึกษา หรือ ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@school.ac.th หรือ username"
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01]"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Google Sign-in */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            เข้าใช้ด้วยบัญชี Google โรงเรียน
          </button>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
            ทดลองใช้งานแบบด่วน (One-Click Demo Roles)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('teacher')}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <GraduationCap className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
              คุณครูผู้ส่งงาน (Teacher)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-center text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <Shield className="w-4 h-4 mx-auto mb-1 text-rose-600" />
              แอดมินฝ่ายตรวจงาน (Admin)
            </button>
          </div>
        </div>

      </div>

      <p className="text-[11px] text-slate-500 mt-6 text-center">
        เชื่อมต่อ Firebase Authentication & Google Drive API • มาตรฐานความปลอดภัยโรงเรียน 2569
      </p>

    </div>
  );
};
