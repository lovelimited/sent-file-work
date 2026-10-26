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
  ArrowRight, 
  Check,
  ShieldCheck
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
    const isInAppBrowser = typeof navigator !== 'undefined' && /Line\/|FBAN|FBAV|Instagram/i.test(navigator.userAgent);

    if (isInAppBrowser) {
      Swal.fire({
        title: 'เปิดด้วย Safari / Chrome',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #334155;">
            <p style="margin-bottom: 8px;"><b>สาเหตุ:</b> ระบบ Google ไม่อนุญาตให้ล็อกอินผ่านเบราว์เซอร์ภายในแอป LINE โดยตรง (จะพบข้อผิดพลาด Unable to process request due to missing initial state)</p>
            <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; color: #92400e;">
              <b>วิธีแก้ที่ง่ายที่สุด:</b>
              <ol style="padding-left: 20px; margin: 4px 0 0 0;">
                <li>กดปุ่ม <b>"🌐 เปิดใน Safari / Chrome"</b> ด้านล่างนี้ หรือ</li>
                <li>กดปุ่ม <b>[...]</b> ที่มุมขวาล่างของ LINE แล้วเลือก <b>"เปิดด้วยเบราว์เซอร์เริ่มต้น"</b></li>
              </ol>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0;">* หรือคุณครูสามารถเข้าสู่ระบบด้วย <b>อีเมล และรหัสผ่าน</b> ในหน้านี้ได้ทันทีโดยไม่ต้องเปิด Safari ครับ</p>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '🌐 เปิดใน Safari / Chrome ทันที',
        cancelButtonText: 'ใช้รหัสผ่านในหน้านี้',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b'
      }).then((result) => {
        if (result.isConfirmed) {
          const sep = window.location.href.includes('?') ? '&' : '?';
          window.location.href = window.location.href + sep + 'openExternalBrowser=1';
        }
      });
      return;
    }

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
            <div style="text-align: left; font-size: 14px; line-height: 1.6; color: #334155;">
              <p style="margin-bottom: 8px;">สาเหตุ: บัญชี Firebase โครงการ <b>send-file-51069</b> ยังไม่ได้กดเปิดสวิตช์ <b>Google Sign-in</b> ใน Firebase Console</p>
              <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; color: #92400e;">
                <b style="display: block; margin-bottom: 4px;">วิธีเปิดใช้งาน (ทำเพียงครั้งเดียว):</b>
                <ol style="padding-left: 20px; margin: 0;">
                  <li>ไปที่ลิงก์ <a href="https://console.firebase.google.com/project/send-file-51069/authentication/providers" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Firebase Console &gt; Sign-in method</a></li>
                  <li>คลิกเลือก <b>Google</b></li>
                  <li>กดเปิดสวิตช์ <b>Enable</b></li>
                </ol>
              </div>
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
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center px-4 py-4 sm:py-6 overflow-x-hidden font-sans select-none bg-slate-50">
      
      {/* ======================================================== */}
      {/* 3D LIGHT SPACE CELESTIAL BACKGROUND                     */}
      {/* ======================================================== */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-100"
        style={{ backgroundImage: `url('/space-bg.jpg')` }}
      />
      
      {/* Soft Luminous Celestial Tint */}
      <div className="fixed inset-0 bg-gradient-to-tr from-sky-100/65 via-white/55 to-indigo-100/65 backdrop-blur-[2px] pointer-events-none" />

      {/* Floating 3D Celestial Sparkles */}
      <div className="fixed top-8 left-10 text-sky-400 text-2xl animate-space-twinkle pointer-events-none">✦</div>
      <div className="fixed top-12 right-14 text-amber-400 text-xl animate-space-twinkle [animation-delay:1s] pointer-events-none">✧</div>
      <div className="fixed bottom-12 left-12 text-indigo-400 text-2xl animate-space-twinkle [animation-delay:1.5s] pointer-events-none">✦</div>
      <div className="fixed bottom-14 right-16 text-pink-400 text-xl animate-space-twinkle [animation-delay:0.7s] pointer-events-none">✧</div>

      {/* Ambient Glow Orbs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-sky-300/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-purple-300/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Spacer */}
      <div className="h-1" />

      {/* ======================================================== */}
      {/* MAIN DUAL-PANEL CARD: FULL-SIZED, BOLD, AND WELL SPACED  */}
      {/* ======================================================== */}
      <div className="relative z-20 w-full max-w-4xl my-auto bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.18)] rounded-3xl overflow-hidden flex flex-col md:flex-row transition-all">
        
        {/* ---------------------------------------------------- */}
        {/* LEFT PANEL: Identity and Branding                    */}
        {/* ---------------------------------------------------- */}
        <div className="md:w-5/12 bg-gradient-to-br from-sky-50/90 via-indigo-50/70 to-blue-50/80 p-6 sm:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200/80">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-sm border border-slate-200/90 p-1.5 flex items-center justify-center mb-5">
            <img 
              src="/logo.jpg" 
              alt="School Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
              {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
              ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารวิชาการ
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* RIGHT PANEL: Spacious, Full-Sized Form Area         */}
        {/* ---------------------------------------------------- */}
        <div className="md:w-7/12 p-5 sm:p-6 flex flex-col justify-between bg-white">
          
          {/* Top Segmented Tab Switcher */}
          <div>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/90 mb-3">
              <button
                id="tab-btn-login"
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ (Sign In)
              </button>
              <button
                id="tab-btn-register"
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                ลงทะเบียนครูใหม่ (Register)
              </button>
            </div>
          </div>

          {/* In-App Browser (LINE / FB) Warning Banner */}
          {typeof navigator !== 'undefined' && /Line\/|FBAN|FBAV|Instagram/i.test(navigator.userAgent) && (
            <div className="mb-3 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📱</span>
                <div>
                  <p className="font-bold">เปิดจากแอป LINE</p>
                  <p className="text-[11px] text-amber-700">แนะนำเปิดใน Safari เพื่อล็อกอินด้วย Google ได้ราบรื่น</p>
                </div>
              </div>
              <a
                href={window.location.href.includes('?') ? `${window.location.href}&openExternalBrowser=1` : `${window.location.href}?openExternalBrowser=1`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-all flex-shrink-0"
              >
                เปิดใน Safari
              </a>
            </div>
          )}

          {/* TAB 1: LOGIN FORM (BOLD, READABLE, FULL SIZED) */}
          {activeTab === 'login' && (
            <form onSubmit={handleStandardLogin} className="space-y-2.5 animate-in fade-in duration-150">
              
              {/* Identifier */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  อีเมล หรือ ชื่อผู้ใช้งาน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-login-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="เช่น teacher@school.ac.th หรือชื่อผู้ใช้งาน"
                    className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 sm:py-3 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-11 py-2.5 sm:py-3 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">จดจำการเข้าใช้</span>
                </label>
              </div>

              {/* Side-by-Side Action Buttons (Saves Vertical Space & Looks Bold!) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      เข้าสู่ระบบ
                    </>
                  )}
                </button>

                <button
                  id="btn-google-login"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google Sign-In
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: TEACHER REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleTeacherRegistration} className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="input-reg-firstname"
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="ชื่อจริง *"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
                <input
                  id="input-reg-lastname"
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="นามสกุล *"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  id="input-reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="อีเมล เช่น teacher@school.ac.th *"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
                <input
                  id="input-reg-phone"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="เบอร์โทรติดต่อ"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <select
                id="select-reg-department"
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((grade) => {
                  const isSelected = selectedGrades.includes(grade);
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {grade}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="รหัสผ่าน (6+ ตัว) *"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-3 pr-7 py-2 text-slate-900 bg-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <input
                  id="input-reg-confirm-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่าน *"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white font-mono"
                  required
                />
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'ยืนยันการลงทะเบียนคุณครู'
                )}
              </button>
            </form>
          )}

          {/* Bottom Security Note */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ระบบรักษาความปลอดภัยข้อมูลวิชาการ</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">โรงเรียนสารสาสน์วิเทศราชพฤกษ์</span>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* BOTTOM FOOTER CREDIT                                     */}
      {/* ======================================================== */}
      <footer className="relative z-20 py-2 text-center text-xs text-slate-600 font-medium">
        © 2569 {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'} • ออกแบบและพัฒนาระบบโดย <span className="font-black text-blue-700">ม.กฤตพจน์  แก้วกา</span>
      </footer>

    </div>
  );
};
