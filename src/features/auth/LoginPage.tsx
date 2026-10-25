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
  FileCheck2, 
  TableProperties, 
  Orbit, 
  Check,
  ShieldCheck,
  Award
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
    <div className="relative h-screen max-h-screen w-full flex flex-col justify-between overflow-hidden select-none font-sans bg-slate-100">
      
      {/* ======================================================== */}
      {/* 3D LIGHT SPACE CELESTIAL BACKGROUND                     */}
      {/* ======================================================== */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-100"
        style={{ backgroundImage: `url('/space-bg.jpg')` }}
      />
      
      {/* Luminous Light Glass Tint Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-100/75 via-white/65 to-indigo-100/75 backdrop-blur-[1px] pointer-events-none" />

      {/* Floating 3D Celestial Sparkles */}
      <div className="absolute top-10 left-8 text-sky-400 text-xl animate-space-twinkle pointer-events-none">✦</div>
      <div className="absolute top-16 right-12 text-amber-400 text-lg animate-space-twinkle [animation-delay:1s] pointer-events-none">✧</div>
      <div className="absolute bottom-14 left-10 text-indigo-400 text-xl animate-space-twinkle [animation-delay:1.5s] pointer-events-none">✦</div>
      <div className="absolute bottom-16 right-14 text-pink-400 text-lg animate-space-twinkle [animation-delay:0.7s] pointer-events-none">✧</div>

      {/* Ambient Floating Glow Blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-sky-300/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-300/20 rounded-full blur-[90px] pointer-events-none" />

      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR (Compact ~46px, Fits Cleanly)          */}
      {/* ======================================================== */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2 bg-white/80 backdrop-blur-md border-b border-white/80 shadow-2xs flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg p-0.5 bg-white shadow-xs border border-slate-200 flex items-center justify-center flex-shrink-0">
            <img 
              src="/logo.jpg" 
              alt="School Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-tight">
              {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium leading-none">
              ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารวิชาการ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold shadow-2xs">
            <Orbit className="w-3 h-3 text-sky-600 animate-spin [animation-duration:15s]" />
            <span>3D Space Academic Portal</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>ปีการศึกษา {settings.academicYear} / {settings.semester}</span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN HERO CARD (Compact, Fits 100% in 550px viewport) */}
      {/* ======================================================== */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 min-h-0">
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_15px_40px_-10px_rgba(30,58,138,0.15)] rounded-2xl overflow-hidden flex flex-col md:flex-row my-auto transition-all">
          
          {/* ---------------------------------------------------- */}
          {/* LEFT COLUMN: 3D Showcase & Credits (Compact Desktop) */}
          {/* ---------------------------------------------------- */}
          <div className="hidden md:flex md:w-5/12 flex-col justify-between p-4 lg:p-5 bg-gradient-to-br from-sky-50/90 via-indigo-50/70 to-blue-50/80 border-r border-slate-200/70 relative">
            
            {/* Top Showcase Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100/90 border border-blue-200 text-blue-800 text-[10px] font-extrabold">
                  <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                  3D Digital Station
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  SARASAS WIPHIT
                </span>
              </div>

              {/* 3D Mascot Preview */}
              <div className="relative mx-auto my-0.5 w-20 h-20 rounded-2xl overflow-hidden bg-white/90 p-1 shadow-xs border border-white flex items-center justify-center">
                <img 
                  src="/astronaut-3d.jpg" 
                  alt="3D Space Mascot" 
                  className="w-full h-full object-cover rounded-xl animate-space-float" 
                />
              </div>

              <div className="text-center mt-1">
                <h2 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                  สถานีส่งงานวิชาการ 3D
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug">
                  ส่งแผนการสอน ตรวจรับรอง และซิงค์ Google Sheets เรียลไทม์
                </p>
              </div>

              {/* 3 Key Feature Chips */}
              <div className="grid grid-cols-1 gap-1 mt-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 border border-slate-200/80 shadow-2xs">
                  <FileCheck2 className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700">ส่งงาน & ตรวจรับรองผลวิชาการ</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 border border-slate-200/80 shadow-2xs">
                  <TableProperties className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700">Google Sheets Sync เรียลไทม์</span>
                </div>
              </div>
            </div>

            {/* Developer Card Signature */}
            <div className="pt-2 mt-1 border-t border-slate-200/70 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-[11px] shadow-xs flex-shrink-0">
                ก
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[8px] text-slate-400 font-bold uppercase leading-none">ออกแบบและพัฒนาโดย</p>
                <p className="text-[11px] font-black text-slate-800 truncate leading-tight mt-0.5">ม.กฤตพจน์  แก้วกา</p>
              </div>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* RIGHT COLUMN: Ultra-Clean Form Area (Never Cut Off)  */}
          {/* ---------------------------------------------------- */}
          <div className="w-full md:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white">
            
            {/* Header & Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
                    {activeTab === 'login' ? 'เข้าสู่ระบบส่งงาน' : 'ลงทะเบียนคุณครูใหม่'}
                    <Sparkles className="w-4 h-4 text-sky-500" />
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {activeTab === 'login' 
                      ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบงานวิชาการ' 
                      : 'กรอกรายละเอียดเพื่อเปิดใช้งานบัญชีส่งงาน'}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-200">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>ระบบปลอดภัย</span>
                </div>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 mb-2.5">
                <button
                  id="tab-btn-login"
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-blue-600 shadow-2xs border border-slate-200'
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
                      ? 'bg-white text-blue-600 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  ลงทะเบียนครูใหม่ (Register)
                </button>
              </div>
            </div>

            {/* TAB BODIES */}
            <div className="flex-1 flex flex-col justify-center">
              
              {/* TAB 1: LOGIN (FITS 100% WITHOUT SCROLLING) */}
              {activeTab === 'login' && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <form onSubmit={handleStandardLogin} className="space-y-2">
                    
                    {/* Identifier */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-0.5">
                        อีเมล หรือ ชื่อผู้ใช้งาน <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="input-login-identifier"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="drive.limited@gmail.com หรือชื่อผู้ใช้"
                          className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-bold text-slate-800">
                          รหัสผ่าน <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          ลืมรหัสผ่าน?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="input-login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-9 py-1.5 text-slate-900 bg-white hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
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
                    </div>

                    {/* Remember me + Admin Hint */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3 h-3 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600 font-medium">จดจำการเข้าสู่ระบบ</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Admin: drive.limited@gmail.com
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      id="btn-login-submit"
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.005] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          กำลังเข้าสู่ระบบ...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3.5 h-3.5" />
                          เข้าสู่ระบบ (Sign In)
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white px-2 text-slate-400 font-bold">
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
                      className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      เข้าสู่ระบบด้วย Google
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TEACHER REGISTRATION FORM (SCROLLABLE & TIDY) */}
              {activeTab === 'register' && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <p className="font-bold leading-tight">
                      เปิดใช้งานบัญชีส่งงานวิชาการได้ทันทีหลังลงทะเบียน
                    </p>
                  </div>

                  <form onSubmit={handleTeacherRegistration} className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {/* Names */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                          ชื่อจริง <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-reg-firstname"
                          type="text"
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          placeholder="เช่น สมศรี"
                          className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                          นามสกุล <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-reg-lastname"
                          type="text"
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          placeholder="เช่น ใจดีเลิศ"
                          className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                          อีเมล <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="teacher@school.ac.th"
                          className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                          เบอร์โทรติดต่อ
                        </label>
                        <input
                          id="input-reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="08x-xxx-xxxx"
                          className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                        กลุ่มสาระการเรียนรู้ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="select-reg-department"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
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
                      <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                        รายวิชาที่สอน (เช่น วิทยาการคำนวณ)
                      </label>
                      <input
                        id="input-reg-subjects"
                        type="text"
                        value={regSubjects}
                        onChange={(e) => setRegSubjects(e.target.value)}
                        placeholder="วิทยาการคำนวณ, ออกแบบเทคโนโลยี"
                        className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Grade Levels */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                        ระดับชั้นที่สอน
                      </label>
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
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                              {grade}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                          รหัสผ่าน (6+ ตัว) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="input-reg-password"
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-xs rounded-md border border-slate-300 pl-2 pr-6 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 font-mono"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-800 mb-0.5">
                          ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-reg-confirm-password"
                          type={showRegPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs rounded-md border border-slate-300 px-2 py-1 text-slate-900 bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      id="btn-register-submit"
                      type="submit"
                      disabled={isRegistering}
                      className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          กำลังสร้างบัญชีคุณครู...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          ยืนยันการลงทะเบียนคุณครู
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Mobile Footer Credit inside card */}
            <div className="pt-2 mt-2 border-t border-slate-100 flex md:hidden items-center justify-between text-[10px] text-slate-500">
              <span>พัฒนาระบบโดย</span>
              <span className="font-extrabold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                ม.กฤตพจน์  แก้วกา
              </span>
            </div>

          </div>

        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. PERSISTENT FULL-WIDTH BOTTOM FOOTER CREDIT (~32px)   */}
      {/* ======================================================== */}
      <footer className="relative z-20 w-full px-4 sm:px-6 py-1.5 bg-white/85 backdrop-blur-md border-t border-white/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-600 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-700">
            © 2569 {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'} • ระบบส่งงานครูและตรวจประเมินวิชาการ
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">ออกแบบและพัฒนาระบบโดย:</span>
          <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
            ม.กฤตพจน์  แก้วกา
          </span>
        </div>
      </footer>

    </div>
  );
};
