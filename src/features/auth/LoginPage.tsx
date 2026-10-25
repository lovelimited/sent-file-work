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
  Rocket
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
        confirmButtonColor: '#0284c7'
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
        confirmButtonColor: '#0284c7'
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
                  <li>ไปที่ลิงก์ <a href="https://console.firebase.google.com/project/send-file-51069/authentication/providers" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: bold;">Firebase Console &gt; Sign-in method</a></li>
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
          confirmButtonColor: '#0284c7'
        });
      } else {
        Swal.fire({
          title: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ',
          text: res.error,
          icon: 'warning',
          confirmButtonColor: '#0284c7'
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
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      Swal.fire({
        title: 'รูปแบบอีเมลไม่ถูกต้อง',
        text: 'กรุณากรอกอีเมลที่ถูกต้อง เช่น teacher@school.ac.th',
        icon: 'warning',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    if (regPassword.length < 6) {
      Swal.fire({
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย',
        icon: 'warning',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Swal.fire({
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบรหัสผ่านและการยืนยันรหัสผ่านให้ตรงกัน',
        icon: 'warning',
        confirmButtonColor: '#0284c7'
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
        confirmButtonColor: '#0284c7'
      }).then(() => {
        navigate('/');
      });
    } else {
      Swal.fire({
        title: 'ลงทะเบียนไม่สำเร็จ',
        text: res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonColor: '#0284c7'
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
      confirmButtonColor: '#0284c7',
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
        confirmButtonColor: '#0284c7'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* 3D Bright Space Background Image with soft luminous overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 pointer-events-none transition-opacity"
        style={{ backgroundImage: `url('/space-bg.jpg')` }}
      />
      
      {/* Soft ethereal light gradient washes */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/50 to-sky-100/70 backdrop-blur-[2px] pointer-events-none"></div>

      {/* Floating 3D Star Sparkles */}
      <div className="absolute top-12 left-16 text-amber-300 text-2xl animate-space-twinkle pointer-events-none select-none">✦</div>
      <div className="absolute top-28 right-24 text-sky-400 text-3xl animate-space-twinkle [animation-delay:1s] pointer-events-none select-none">✧</div>
      <div className="absolute bottom-32 left-28 text-purple-400 text-2xl animate-space-twinkle [animation-delay:1.5s] pointer-events-none select-none">✦</div>
      <div className="absolute bottom-20 right-32 text-pink-300 text-3xl animate-space-twinkle [animation-delay:0.7s] pointer-events-none select-none">✧</div>
      <div className="absolute top-1/2 left-8 text-amber-200 text-xl animate-space-twinkle [animation-delay:2s] pointer-events-none select-none">★</div>
      <div className="absolute top-1/3 right-12 text-cyan-300 text-2xl animate-space-twinkle [animation-delay:1.2s] pointer-events-none select-none">✦</div>

      {/* Top Floating Mini School Pill */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-3 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/80 text-xs text-slate-700 shadow-sm shadow-sky-100/50">
          <School className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-800 tracking-wide">
            {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
          </span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-100/90 border border-sky-200/80 text-[11px] font-bold text-sky-800 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-spin [animation-duration:8s]" />
          ปีการศึกษา {settings.academicYear} / ภาคเรียนที่ {settings.semester}
        </div>
      </header>

      {/* Main Dual-Panel Bright 3D Space Container */}
      <div className="w-full max-w-5xl bg-white/85 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(56,189,248,0.25)] border border-white/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* LEFT PANEL: Luminous 3D Space Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-sky-50/95 via-indigo-50/90 to-purple-50/95 p-7 sm:p-9 text-slate-800 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-sky-100/80">
          
          {/* Subtle inside iridescent glow */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-sky-300/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Brand Identity & 3D Planet Mascot */}
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl p-1 bg-white shadow-md border-2 border-amber-300/80 flex items-center justify-center flex-shrink-0 group hover:rotate-3 transition-transform">
                <img 
                  src="/logo.jpg" 
                  alt="School Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
                  <Orbit className="w-3 h-3 text-sky-600 animate-spin [animation-duration:12s]" />
                  3D Space Academic Portal
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug mt-1">
                  {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ฝ่ายบริหารงานวิชาการและงานวิจัย
                </p>
              </div>
            </div>

            {/* 3D Mascot Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-400/10 via-purple-400/10 to-pink-400/10 border border-sky-200/60 backdrop-blur-md flex items-center gap-3 animate-space-float">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-white flex-shrink-0 bg-white">
                <img 
                  src="/astronaut-3d.jpg" 
                  alt="3D Astronaut Mascot" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                  🪐 คอสมอสวิชาการ 2569
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  ระบบส่งงานครู ตรวจประเมิน และคลังเอกสาร
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  สะดวก รวดเร็ว ปลอดภัยบนระบบคลาวด์
                </p>
              </div>
            </div>

            {/* Core Features Cards */}
            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center flex-shrink-0 font-bold">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">ระบบส่งงาน & แผนการสอนดิจิทัล</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    ส่งงานตามหัวข้อเรื่อง แนบไฟล์ย่อย ตรวจรับรอง และดูผลประเมินแบบเรียลไทม์
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">
                  <TableProperties className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Google Sheets Realtime Auto-Sync</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    เชื่อมต่อคลาวด์สรุปผลการส่งงานขึ้น Google Sheets โดยตรง ไม่ต้องกดส่งออกเอง
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Google Cloud & Firebase Security</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    จำกัดการเข้าถึงไฟล์เฉพาะเจ้าของงานและแอดมินผู้ตรวจงานเท่านั้น
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Credit Signature Card */}
          <div className="pt-4 mt-4 border-t border-sky-100/80 relative z-10">
            <div className="p-3 rounded-2xl bg-white/90 border border-sky-200/70 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-400/20 flex-shrink-0">
                ก
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-sky-700 font-extrabold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  ออกแบบและพัฒนาระบบโดย
                </p>
                <p className="text-sm font-black text-slate-900 truncate tracking-wide">
                  ม.กฤตพจน์  แก้วกา
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  ฝ่ายพัฒนานวัตกรรมและระบบงานดิจิทัล
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Bright Authentication & Registration Form */}
        <div className="lg:col-span-7 bg-white/95 p-7 sm:p-10 flex flex-col justify-center text-slate-900">
          
          {/* Header Title inside Form */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {activeTab === 'login' ? 'เข้าสู่ระบบส่งงาน' : 'ลงทะเบียนสำหรับคุณครู'}
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'login' 
                  ? 'ยินดีต้อนรับคณะครูและบุคลากรทางการศึกษา กรุณากรอกข้อมูลเพื่อเข้าใช้งาน' 
                  : 'สำหรับคุณครูใหม่ กรุณากรอกรายละเอียดเพื่อเปิดใช้งานบัญชีส่งงานวิชาการ'}
              </p>
            </div>
          </div>

          {/* Space Segmented Tab Bar */}
          <div className="flex rounded-2xl bg-sky-50/80 p-1.5 border border-sky-100 mb-5">
            <button
              id="tab-btn-login"
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-sky-600 shadow-md shadow-sky-200/50 border border-sky-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Rocket className="w-4 h-4 text-sky-500" />
              เข้าสู่ระบบ (Sign In)
            </button>
            <button
              id="tab-btn-register"
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-sky-600 shadow-md shadow-sky-200/50 border border-sky-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-purple-500" />
              ลงทะเบียนครูใหม่ (Register)
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    อีเมล หรือ ชื่อผู้ใช้งาน (Username / Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-login-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="เช่น drive.limited@gmail.com หรือชื่อผู้ใช้"
                      className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-400 transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      รหัสผ่าน (Password)
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-11 py-3 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-400 transition-all shadow-2xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                      className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-600 font-medium">จดจำการเข้าสู่ระบบ</span>
                  </label>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
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
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
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
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/60 active:bg-sky-100 text-slate-700 text-xs font-bold transition-all hover:shadow-2xs cursor-pointer disabled:opacity-50"
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
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">ลงทะเบียนสำหรับคุณครูผู้สอน</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    เมื่อลงทะเบียนสำเร็จ บัญชีจะเปิดใช้งานทันทีเพื่อส่งแผนการสอนและงานวิชาการ
                  </p>
                </div>
              </div>

              <form onSubmit={handleTeacherRegistration} className="space-y-3.5">
                {/* Names in 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ชื่อจริง *
                    </label>
                    <input
                      id="input-reg-firstname"
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="เช่น สมศรี"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      นามสกุล *
                    </label>
                    <input
                      id="input-reg-lastname"
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="เช่น ใจดีเลิศ"
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      อีเมลประจำตัว *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="teacher@school.ac.th"
                        className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-reg-phone"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="08x-xxx-xxxx"
                        className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Learning Area / Department */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    กลุ่มสาระการเรียนรู้ *
                  </label>
                  <select
                    id="select-reg-department"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    รายวิชาที่สอน (คั่นด้วยเครื่องหมายจุลภาค ,)
                  </label>
                  <div className="relative">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-subjects"
                      type="text"
                      value={regSubjects}
                      onChange={(e) => setRegSubjects(e.target.value)}
                      placeholder="เช่น วิทยาการคำนวณ, ออกแบบและเทคโนโลยี"
                      className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Grade Levels Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    ระดับชั้นที่สอน (เลือกได้หลายระดับชั้น)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADE_OPTIONS.map((grade) => {
                      const isSelected = selectedGrades.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => toggleGrade(grade)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Passwords in 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-8 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ยืนยันรหัสผ่าน *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-reg-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-slate-800 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isRegistering}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-700 hover:from-teal-600 hover:to-emerald-800 text-white text-xs font-bold shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
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

      </div>

      {/* FOOTER CREDIT: ม.กฤตพจน์ แก้วกา */}
      <footer className="w-full max-w-5xl mt-4 text-center space-y-1.5 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 text-slate-700 text-xs shadow-md shadow-sky-100/60">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-500">พัฒนาระบบโดย</span>
          <span className="font-bold text-slate-900 text-sm tracking-wide">ม.กฤตพจน์  แก้วกา</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">{settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}</span>
        </div>
        <p className="text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารสำหรับผู้บริหาร • Google Workspace & Firebase Cloud
        </p>
      </footer>

    </div>
  );
};
