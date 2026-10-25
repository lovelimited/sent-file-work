import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, TeacherRegistrationData } from '../../context/AuthContext';
import { getSettings } from '../../lib/storage';
import { 
  LogIn, 
  UserPlus,
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  School,
  Loader2,
  Phone,
  BookOpen,
  Sparkles,
  ArrowRight,
  FileCheck2,
  TableProperties,
  Award,
  Orbit,
  Rocket,
  Check
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
              <p style="font-size: 11px; color: #64748b; margin: 0;">* ในระหว่างนี้ สามารถเข้าใช้งานด้วยอีเมล <b>drive.limited@gmail.com</b> และรหัสผ่าน <b>krittapot001</b> ได้ตามปกติครับ</p>
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
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden bg-white font-sans">
      
      {/* ======================================================== */}
      {/* LEFT SIDE: Full-Height 3D Space & Celestial Showcase     */}
      {/* ======================================================== */}
      <div className="lg:w-5/12 xl:w-1/2 min-h-[380px] lg:h-full relative overflow-hidden bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-8 xl:p-12 select-none">
        
        {/* Real 3D Space Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 pointer-events-none scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('/space-bg.jpg')` }}
        />

        {/* Dynamic Celestial Deep Gradient Overlay for Maximum Legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-indigo-950/85 to-slate-950/95 pointer-events-none"></div>

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-10 -left-20 w-80 h-80 bg-sky-500/20 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Floating 3D Sparkle Stars */}
        <div className="absolute top-16 right-16 text-amber-300 text-xl animate-space-twinkle pointer-events-none">✦</div>
        <div className="absolute top-1/3 left-10 text-sky-400 text-2xl animate-space-twinkle [animation-delay:1s] pointer-events-none">✧</div>
        <div className="absolute bottom-28 right-20 text-purple-300 text-xl animate-space-twinkle [animation-delay:1.5s] pointer-events-none">✦</div>

        {/* Top Header Section */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-sky-200">
              <Orbit className="w-3.5 h-3.5 text-sky-300 animate-spin [animation-duration:15s]" />
              <span className="font-bold tracking-wide">3D Space Academic Portal</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              ปีการศึกษา {settings.academicYear} / {settings.semester}
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1 bg-white shadow-xl border-2 border-amber-300 flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo.jpg" 
                alt="School Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl xl:text-2xl font-black text-white tracking-tight leading-tight">
                {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
              </h1>
              <p className="text-xs sm:text-sm text-sky-200/90 font-medium mt-0.5">
                ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารวิชาการ
              </p>
            </div>
          </div>
        </div>

        {/* Middle: 3D Astronaut Mascot & Feature Highlights */}
        <div className="relative z-10 my-auto py-4 sm:py-6 space-y-3.5">
          {/* 3D Mascot Floating Card */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg flex items-center gap-3.5 hover:bg-white/15 transition-all">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white/90 flex-shrink-0 bg-white">
              <img 
                src="/astronaut-3d.jpg" 
                alt="3D Astronaut Mascot" 
                className="w-full h-full object-cover animate-space-float"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                  🪐 นวัตกรรมดิจิทัล 2569
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                สถานีส่งงานวิชาการและวิจัยในชั้นเรียน
              </p>
              <p className="text-[11px] text-sky-200/80 leading-relaxed">
                ส่งงาน ตรวจรับรอง และซิงค์ขึ้น Google Sheets อัตโนมัติแบบเรียลไทม์
              </p>
            </div>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold mb-1">
                <FileCheck2 className="w-4 h-4 text-sky-400" />
                <span>ส่งงาน & แผนการสอน</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                แนบไฟล์ย่อย ตรวจรับรอง และดูผลประเมินได้ทันที
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold mb-1">
                <TableProperties className="w-4 h-4 text-emerald-400" />
                <span>Google Sheets Sync</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ซิงค์สถานะการส่งงานขึ้นคลาวด์ชีตอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Left: Developer Credit Signature */}
        <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              ก
            </div>
            <div>
              <p className="text-[10px] text-sky-300/90 uppercase tracking-wider font-bold">
                ออกแบบและพัฒนาระบบโดย
              </p>
              <p className="text-xs sm:text-sm font-black text-white tracking-wide">
                ม.กฤตพจน์  แก้วกา
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            ฝ่ายพัฒนานวัตกรรม
          </span>
        </div>

      </div>

      {/* ======================================================== */}
      {/* RIGHT SIDE: Crystal-Clear, High-Contrast Form (Full View) */}
      {/* ======================================================== */}
      <div className="lg:w-7/12 xl:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 xl:p-14 overflow-y-auto bg-white">
        
        {/* Top Header of Form */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {activeTab === 'login' ? 'เข้าสู่ระบบส่งงาน' : 'ลงทะเบียนคุณครูใหม่'}
                <Sparkles className="w-5 h-5 text-sky-500" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {activeTab === 'login' 
                  ? 'กรุณากรอกอีเมลหรือชื่อผู้ใช้งาน และรหัสผ่านเพื่อเข้าสู่ระบบ' 
                  : 'กรอกรายละเอียดเพื่อเปิดใช้งานบัญชีส่งแผนและงานวิชาการ'}
              </p>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 mb-5">
            <button
              id="tab-btn-login"
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-600 shadow-md border border-slate-200/80'
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-md border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              ลงทะเบียนครูใหม่ (Register)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="my-auto">
          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    อีเมล หรือ ชื่อผู้ใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-login-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="เช่น drive.limited@gmail.com หรือชื่อผู้ใช้"
                      className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 sm:py-3 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      รหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
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
                      className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-11 py-2.5 sm:py-3 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-slate-600 font-medium">จดจำการเข้าสู่ระบบ</span>
                  </label>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
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
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-3 sm:my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                    หรือเข้าใช้ด้วย
                  </span>
                </div>
              </div>

              {/* Google Sign-In */}
              <div>
                <button
                  id="btn-google-login"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  เข้าใช้ด้วยบัญชี Google
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHER REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="font-semibold">
                  เมื่อลงทะเบียนสำเร็จ บัญชีจะเปิดใช้งานและเข้าสู่ระบบส่งงานวิชาการได้ทันที
                </p>
              </div>

              <form onSubmit={handleTeacherRegistration} className="space-y-3">
                {/* Names in 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ชื่อจริง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-reg-firstname"
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="เช่น สมศรี"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-reg-lastname"
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="เช่น ใจดีเลิศ"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      อีเมลประจำตัว <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="teacher@school.ac.th"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <input
                      id="input-reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="08x-xxx-xxxx"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Learning Area / Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    กลุ่มสาระการเรียนรู้ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-reg-department"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subjects */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    รายวิชาที่สอน (คั่นด้วยจุลภาค ,)
                  </label>
                  <input
                    id="input-reg-subjects"
                    type="text"
                    value={regSubjects}
                    onChange={(e) => setRegSubjects(e.target.value)}
                    placeholder="เช่น วิทยาการคำนวณ, ออกแบบและเทคโนโลยี"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Grade Levels Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ระดับชั้นที่สอน
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADE_OPTIONS.map((grade) => {
                      const isSelected = selectedGrades.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => toggleGrade(grade)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Passwords in 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      รหัสผ่าน (อย่างน้อย 6 ตัว) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="input-reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs rounded-xl border border-slate-300 pl-3 pr-8 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-reg-confirm-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isRegistering}
                  className="w-full mt-1.5 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังสร้างบัญชีคุณครู...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      ยืนยันการลงทะเบียนคุณครู
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Footer Credit of Right Panel */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>พัฒนาระบบโดย</span>
            <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              ม.กฤตพจน์  แก้วกา
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
          </p>
        </div>

      </div>

    </div>
  );
};
