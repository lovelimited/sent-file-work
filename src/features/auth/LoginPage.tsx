import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, TeacherRegistrationData } from '../../context/AuthContext';
import { getSettings } from '../../lib/storage';
import { 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Check,
  ShieldCheck,
  Orbit
} from 'lucide-react';
import Swal from 'sweetalert2';

const DEPARTMENTS = [
  'วิทยาศาสตร์และเทคโนโลยี',
  'คณิตศาสตร์',
  'ภาษาไทย',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'ภาษาต่างประเทศ',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ',
  'การงานอาชีพ',
  'กิจกรรมพัฒนาผู้เรียน / วิชาการทั่วไป'
];

const GRADE_OPTIONS = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ประถมศึกษา'];

export const LoginPage: React.FC = () => {
  const { currentUser, login, loginWithGoogle, registerTeacher, resetPassword } = useAuth();
  const settings = getSettings();
  const navigate = useNavigate();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Form States
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState(DEPARTMENTS[0]);
  const [regSubjects, setRegSubjects] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>(['ม.1']);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const toggleGrade = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      if (selectedGrades.length > 1) {
        setSelectedGrades(selectedGrades.filter(g => g !== grade));
      }
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  // Handle Standard Login
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

    setIsLoggingIn(true);
    const res = await login(identifier, password);
    setIsLoggingIn(false);

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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    const res = await loginWithGoogle();
    setIsLoggingIn(false);

    if (res.success) {
      navigate('/');
    } else if (res.error) {
      if (res.error.includes('operation-not-allowed') || res.error.includes('Firebase Console')) {
        Swal.fire({
          title: 'ยังไม่ได้เปิดใช้งาน Google Provider',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #334155;">
              <p style="margin-bottom: 8px;">สาเหตุ: บัญชี Firebase โครงการ <b>send-file-51069</b> ยังไม่ได้กดเปิดสวิตช์ <b>Google Sign-in</b> ใน Firebase Console</p>
              <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 10px 14px; margin-bottom: 10px; color: #92400e;">
                <b style="display: block; margin-bottom: 4px;">วิธีเปิดใช้งาน (ทำเพียงครั้งเดียว):</b>
                <ol style="padding-left: 20px; margin: 0;">
                  <li>ไปที่ลิงก์ <a href="https://console.firebase.google.com/project/send-file-51069/authentication/providers" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Firebase Console &gt; Sign-in method</a></li>
                  <li>คลิกเลือก <b>Google</b></li>
                  <li>กดเปิดสวิตช์ <b>Enable</b></li>
                  <li>เลือกอีเมล Support (drive.limited@gmail.com) แล้วกด <b>Save</b></li>
                </ol>
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 0;">* สามารถเข้าสู่ระบบด้วยอีเมล <b>drive.limited@gmail.com</b> และรหัสผ่าน <b>krittapot001</b> ได้ทันทีครับ</p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'รับทราบ',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          title: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ',
          text: res.error,
          icon: 'warning',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  // Handle Teacher Registration
  const handleTeacherRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim()) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อ นามสกุล และอีเมลให้ครบถ้วน',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      Swal.fire({
        title: 'รูปแบบอีเมลไม่ถูกต้อง',
        text: 'กรุณากรอกอีเมลที่ถูกต้อง เช่น teacher@school.ac.th',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    if (regPassword.length < 6) {
      Swal.fire({
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Swal.fire({
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบรหัสผ่านและการยืนยันรหัสผ่านให้ตรงกัน',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const regData: TeacherRegistrationData = {
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      phone: regPhone,
      learningAreaName: regDepartment,
      subjects: regSubjects,
      gradeLevels: selectedGrades,
      password: regPassword
    };

    setIsRegistering(true);
    const res = await registerTeacher(regData);
    setIsRegistering(false);

    if (res.success) {
      Swal.fire({
        title: 'ลงทะเบียนสำเร็จ!',
        text: `ยินดีต้อนรับ ครู${regFirstName} ${regLastName} เข้าสู่ระบบส่งงานวิชาการ`,
        icon: 'success',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        navigate('/');
      });
    } else {
      Swal.fire({
        title: 'ลงทะเบียนไม่สำเร็จ',
        text: res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'รีเซ็ตรหัสผ่าน (Password Reset)',
      text: 'กรุณากรอกอีเมลที่ลงทะเบียนไว้ ระบบจะจัดส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ',
      input: 'email',
      inputValue: identifier.includes('@') ? identifier : '',
      inputPlaceholder: 'name@school.ac.th หรือ email@gmail.com',
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
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-5 overflow-x-hidden font-sans select-none bg-slate-50">
      
      {/* ======================================================== */}
      {/* 3D LIGHT SPACE CELESTIAL BACKGROUND                     */}
      {/* ======================================================== */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-100"
        style={{ backgroundImage: `url('/space-bg.jpg')` }}
      />
      
      {/* Soft Luminous Celestial Tint */}
      <div className="fixed inset-0 bg-gradient-to-tr from-sky-100/70 via-white/60 to-indigo-100/70 backdrop-blur-[2px] pointer-events-none" />

      {/* Ambient Floating 3D Sparkles */}
      <div className="fixed top-6 left-6 text-sky-400 text-xl animate-space-twinkle pointer-events-none">✦</div>
      <div className="fixed top-8 right-8 text-amber-400 text-lg animate-space-twinkle [animation-delay:1s] pointer-events-none">✧</div>
      <div className="fixed bottom-8 left-8 text-indigo-400 text-xl animate-space-twinkle [animation-delay:1.5s] pointer-events-none">✦</div>
      <div className="fixed bottom-10 right-10 text-pink-400 text-lg animate-space-twinkle [animation-delay:0.7s] pointer-events-none">✧</div>

      {/* Ambient Glow Orbs */}
      <div className="fixed -top-24 -left-24 w-80 h-80 bg-sky-300/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-80 h-80 bg-purple-300/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Top breathing spacer */}
      <div className="h-0.5 sm:h-2" />

      {/* ======================================================== */}
      {/* AIRY, SPACIOUS, BEAUTIFULLY PROPORTIONED CARD           */}
      {/* ======================================================== */}
      <div className="relative z-20 w-full max-w-2xl my-auto bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.16)] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col sm:flex-row transition-all">
        
        {/* ---------------------------------------------------- */}
        {/* LEFT COLUMN: School Identity & 3D Mascot Showcase    */}
        {/* ---------------------------------------------------- */}
        <div className="sm:w-5/12 bg-gradient-to-br from-sky-50/90 via-indigo-50/70 to-blue-50/80 p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-200/70">
          
          <div>
            {/* Top Avatars: School Logo + 3D Astronaut Mascot */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/80 p-0.5 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="School Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/80 p-0.5 flex items-center justify-center flex-shrink-0 animate-space-float">
                <img 
                  src="/astronaut-3d.jpg" 
                  alt="3D Astronaut Mascot" 
                  className="w-full h-full object-cover rounded-lg" 
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-800 text-[10px] font-extrabold ml-auto">
                <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                3D Space
              </span>
            </div>

            <h1 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-tight">
              {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">
              ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารวิชาการ
            </p>

            <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 text-[10px] font-bold text-slate-600 shadow-2xs">
              <Orbit className="w-3 h-3 text-sky-600" />
              <span>ปีการศึกษา {settings.academicYear} / {settings.semester}</span>
            </div>
          </div>

          {/* Developer Credit Signature */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-200/70 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] shadow-xs flex-shrink-0">
              ก
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[8px] text-slate-400 font-bold uppercase leading-none">ออกแบบและพัฒนาโดย</p>
              <p className="text-[11px] font-black text-slate-800 truncate leading-tight mt-0.5">ม.กฤตพจน์  แก้วกา</p>
            </div>
          </div>

        </div>

        {/* ---------------------------------------------------- */}
        {/* RIGHT COLUMN: Clean, Spacious, Fast Login Form       */}
        {/* ---------------------------------------------------- */}
        <div className="sm:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white">
          
          {/* Segmented Tab Bar */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80 mb-3">
            <button
              id="tab-btn-login"
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              เข้าสู่ระบบ (Sign In)
            </button>
            <button
              id="tab-btn-register"
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              ลงทะเบียนครู (Register)
            </button>
          </div>

          {/* TAB 1: LOGIN (CLEAN, NO SCROLLING, EFFORTLESS) */}
          {activeTab === 'login' && (
            <form onSubmit={handleStandardLogin} className="space-y-2.5 animate-in fade-in duration-150">
              
              {/* Identifier */}
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="อีเมล หรือ ชื่อผู้ใช้งาน"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-9 pr-10 py-2 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs px-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium">จดจำการเข้าใช้</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* Action Buttons in 1 Balanced Row */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      เข้าสู่ระบบ
                    </>
                  )}
                </button>

                <button
                  id="btn-google-login"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google Sign-In
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center pt-0.5">
                Admin: drive.limited@gmail.com
              </p>
            </form>
          )}

          {/* TAB 2: TEACHER REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleTeacherRegistration} className="space-y-2 max-h-[220px] overflow-y-auto pr-1 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  id="input-reg-firstname"
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="ชื่อจริง *"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
                <input
                  id="input-reg-lastname"
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="นามสกุล *"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <input
                  id="input-reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="อีเมล เช่น teacher@school.ac.th *"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
                <input
                  id="input-reg-phone"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="เบอร์โทรติดต่อ"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <select
                id="select-reg-department"
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-900 bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1">
                {GRADE_OPTIONS.map((grade) => {
                  const isSelected = selectedGrades.includes(grade);
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                      {grade}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="รหัสผ่าน (6+ ตัว) *"
                    className="w-full text-xs rounded-lg border border-slate-300 pl-2 pr-6 py-1.5 text-slate-900 bg-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>

                <input
                  id="input-reg-confirm-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่าน *"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2 py-1.5 text-slate-900 bg-white font-mono"
                  required
                />
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                disabled={isRegistering}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                ) : (
                  'ยืนยันการลงทะเบียนคุณครู'
                )}
              </button>
            </form>
          )}

        </div>

      </div>

      {/* ======================================================== */}
      {/* BOTTOM FOOTER CREDIT (Airy & Clean)                      */}
      {/* ======================================================== */}
      <footer className="relative z-20 py-1 text-center text-[10px] sm:text-[11px] text-slate-600 font-medium">
        © 2569 {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'} • ออกแบบและพัฒนาระบบโดย <span className="font-black text-blue-700">ม.กฤตพจน์  แก้วกา</span>
      </footer>

    </div>
  );
};
