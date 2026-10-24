import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../lib/storage';
import { 
  LogIn, 
  Shield, 
  GraduationCap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  KeyRound,
  School,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';

export const LoginPage: React.FC = () => {
  const { currentUser, login, loginWithGoogle, resetPassword, switchRole } = useAuth();
  const settings = getSettings();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const [identifier, setIdentifier] = useState('drive.limited@gmail.com');
  const [password, setPassword] = useState('krittapot001');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      Swal.fire({
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        text: 'กรุณากรอกอีเมล/ชื่อผู้ใช้งาน และรหัสผ่าน',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setIsLoading(true);
    const res = await login(identifier, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      Swal.fire({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: res.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
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

  const handleQuickDemoLogin = (role: 'teacher' | 'admin', email?: string) => {
    if (role === 'admin') {
      setIdentifier('drive.limited@gmail.com');
      setPassword('krittapot001');
    } else if (email === 'somchai') {
      setIdentifier('somchai.teacher@school.ac.th');
      setPassword('password123');
    } else {
      setIdentifier('somsri.teacher@school.ac.th');
      setPassword('password123');
    }
    switchRole(role);
    navigate('/');
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'รีเซ็ตรหัสผ่าน (Password Reset)',
      text: 'กรุณากรอกอีเมลสถานศึกษาที่ลงทะเบียนไว้ ระบบจะจัดส่งลิงก์สำหรับตั้งรหัสผ่านใหม่',
      input: 'email',
      inputValue: identifier.includes('@') ? identifier : '',
      inputPlaceholder: 'name@school.ac.th',
      showCancelButton: true,
      confirmButtonText: 'ส่งลิงก์รีเซ็ต',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#2563eb',
      inputValidator: (val) => {
        if (!val || !val.includes('@')) {
          return 'กรุณากรอกอีเมลที่ถูกต้อง';
        }
      }
    });

    if (email) {
      const res = await resetPassword(email);
      Swal.fire({
        title: 'แจ้งเตือนระบบ',
        text: res.message,
        icon: 'info',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 sm:p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">

        {/* Logo & School Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full mx-auto overflow-hidden shadow-lg border-2 border-amber-300/90 bg-white flex items-center justify-center p-1 relative group">
            <img 
              src="/logo.jpg" 
              alt="School Logo" 
              className="w-full h-full object-contain transition-transform group-hover:scale-105" 
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 shadow-2xs">
              <School className="w-3 h-3 text-blue-600" />
              ปีการศึกษา {settings.academicYear} / ภาคเรียนที่ {settings.semester}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 tracking-tight">
              {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารสำหรับผู้บริหาร
            </p>
          </div>
        </div>

        {/* Quick Pre-fill Chips */}
        <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>คลิกเลือกข้อมูลกรอกอัตโนมัติ:</span>
            <span className="text-[10px] text-blue-600 font-mono">1-Click Fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdentifier('drive.limited@gmail.com');
                setPassword('krittapot001');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center justify-between transition-colors"
            >
              <span>🔴 แอดมิน (Admin)</span>
              <span className="font-mono text-[9px] bg-white/80 px-1 py-0.5 rounded border">admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('somsri.teacher@school.ac.th');
                setPassword('password123');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center justify-between transition-colors"
            >
              <span>🟢 ครูสมศรี (Teacher)</span>
              <span className="font-mono text-[9px] bg-white/80 px-1 py-0.5 rounded border">ครู</span>
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมล หรือ ชื่อผู้ใช้งาน (Username / Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="drive.limited@gmail.com หรือ somsri"
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-10 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 font-medium">จดจำการเข้าสู่ระบบ</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Google Workspace Sign-In */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold transition-all hover:shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            เข้าใช้ด้วยบัญชี Google โรงเรียน (Workspace)
          </button>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>เข้าสู่ระบบทันที (1-Click Demo Logins)</span>
            <span className="text-emerald-600 font-semibold lowercase">3 บัญชีพร้อมทดสอบ</span>
          </div>

          <div className="space-y-2">
            {/* Admin Demo */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 text-rose-900 border border-rose-200/80 text-left text-xs transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-rose-950 flex items-center gap-1.5">
                    กฤตพจน์ แอดมินบริหาร (Admin)
                    <span className="text-[10px] bg-rose-200/70 text-rose-800 px-1.5 py-0.2 rounded font-medium">ฝ่ายตรวจงาน</span>
                  </p>
                  <p className="text-[11px] text-rose-700/80 font-mono">drive.limited@gmail.com • krittapot001</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Teacher Demo 1 */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('teacher', 'somsri')}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 border border-emerald-200/80 text-left text-xs transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    ครูสมศรี ใจดีเลิศ (Teacher)
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded font-medium">วิทย์-เทคโนฯ ม.3</span>
                  </p>
                  <p className="text-[11px] text-emerald-700/80 font-mono">somsri.teacher@school.ac.th</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Teacher Demo 2 */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('teacher', 'somchai')}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-900 border border-blue-200/80 text-left text-xs transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-blue-950 flex items-center gap-1.5">
                    ครูสมชาย รักการสอน (Teacher)
                    <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded font-medium">คณิตศาสตร์ ม.5</span>
                  </p>
                  <p className="text-[11px] text-blue-700/80 font-mono">somchai.teacher@school.ac.th</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Security Footer Notice */}
      <div className="text-center mt-6 space-y-1">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ระบบเชื่อมต่อ Firebase Authentication & Cloud Firestore รักษาความปลอดภัยตามมาตรฐาน
        </p>
        <p className="text-[11px] text-slate-500">
          โรงเรียนสารสาสน์วิเทศราชพฤกษ์ • Google Workspace & Drive Scoped Security
        </p>
      </div>

    </div>
  );
};
