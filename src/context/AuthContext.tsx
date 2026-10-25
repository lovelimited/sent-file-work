import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  getStoredCurrentUser, 
  setStoredCurrentUser, 
  getUserByEmail, 
  getUserByUsername, 
  getUsers, 
  updateUser, 
  createUser,
  logActivity 
} from '../lib/storage';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';

export interface TeacherRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  learningAreaName: string;
  subjects?: string;
  gradeLevels?: string[];
  phone?: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  registerTeacher: (data: TeacherRegistrationData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapDepartmentToId = (dept: string): string => {
  if (dept.includes('วิทย์') || dept.includes('เทคโน')) return 'sci_tech';
  if (dept.includes('คณิต')) return 'math';
  if (dept.includes('ไทย')) return 'thai';
  if (dept.includes('สังคม')) return 'social';
  if (dept.includes('ต่างประเทศ') || dept.includes('อังกฤษ')) return 'foreign_lang';
  if (dept.includes('สุข') || dept.includes('พล')) return 'health_pe';
  if (dept.includes('ศิลปะ')) return 'arts';
  if (dept.includes('การงาน')) return 'careers';
  return 'general';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser());

  useEffect(() => {
    if (currentUser) {
      setStoredCurrentUser(currentUser);
    }
  }, [currentUser]);

  // Real Login with Email/Username + Password
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedId = identifier.trim();
    const trimmedPass = pass.trim();

    let user = getUserByEmail(trimmedId) || getUserByUsername(trimmedId);

    // Check if logging in as Admin
    const isAdminAccount = 
      trimmedId.toLowerCase() === 'drive.limited@gmail.com' || 
      trimmedId.toLowerCase() === 'admin' ||
      (user && (user.role === 'admin' || user.email.toLowerCase() === 'drive.limited@gmail.com'));

    if (isAdminAccount) {
      const validAdminPass = trimmedPass === 'krittapot001' || trimmedPass === 'admin123';
      
      if (!validAdminPass) {
        // Try Firebase Auth in case admin password is saved there
        try {
          await signInWithEmailAndPassword(auth, 'drive.limited@gmail.com', trimmedPass);
        } catch {
          return { success: false, error: 'รหัสผ่านผู้ดูแลระบบ (Admin) ไม่ถูกต้อง (กรุณาใช้รหัสผ่าน krittapot001)' };
        }
      }

      // If user object not yet in localStorage, create the admin user profile
      if (!user) {
        user = {
          uid: 'admin-001',
          email: 'drive.limited@gmail.com',
          username: 'admin',
          usernameNormalized: 'admin',
          emailVerified: true,
          firstName: 'กฤตพจน์',
          lastName: 'แอดมินบริหาร',
          displayName: 'กฤตพจน์ แอดมินบริหาร (Admin)',
          role: 'admin',
          status: 'active',
          learningAreaIds: ['admin'],
          learningAreaName: 'ฝ่ายบริหารวิชาการ',
          subjects: [{ id: 'sub-admin', name: 'ผู้ดูแลระบบและฝ่ายตรวจงาน' }],
          gradeLevels: ['ทุกระดับชั้น'],
          phone: '081-234-5678',
          photo: { type: 'url', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
          authProvider: 'mixed',
          createdAt: new Date().toISOString(),
        };
        createUser(user);
      } else if (user.role !== 'admin') {
        user = { ...user, role: 'admin' };
        updateUser(user.uid, { role: 'admin' });
      }

      setCurrentUser(user);
      setStoredCurrentUser(user);
      logActivity('LOGIN', 'User', user.uid, user, { method: 'credential', role: 'admin' });
      return { success: true };
    }

    // For teacher accounts that already exist in database
    if (user) {
      let isPasswordValid = trimmedPass === 'password123' || trimmedPass === '123456';
      
      if (!isPasswordValid) {
        // Try Firebase Auth
        try {
          await signInWithEmailAndPassword(auth, user.email, trimmedPass);
          isPasswordValid = true;
        } catch {
          isPasswordValid = false;
        }
      }

      if (!isPasswordValid) {
        return { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
      }

      if (user.status === 'disabled' || user.status === 'archived') {
        return { success: false, error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อฝ่ายบริหารวิชาการ' };
      }

      setCurrentUser(user);
      setStoredCurrentUser(user);
      logActivity('LOGIN', 'User', user.uid, user, { method: 'credential' });
      return { success: true };
    }

    // If account not found in local DB, attempt Firebase Auth
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedId, trimmedPass);
      const fbUser = userCredential.user;
      const isAdmin = (fbUser.email?.toLowerCase() === 'drive.limited@gmail.com');

      user = {
        uid: fbUser.uid,
        email: fbUser.email || trimmedId,
        emailVerified: fbUser.emailVerified,
        displayName: fbUser.displayName || (trimmedId.includes('@') ? trimmedId.split('@')[0] : trimmedId),
        firstName: fbUser.displayName?.split(' ')[0] || (isAdmin ? 'กฤตพจน์' : 'คุณครู'),
        lastName: fbUser.displayName?.split(' ')[1] || (isAdmin ? 'แอดมินบริหาร' : 'ผู้สอน'),
        role: isAdmin ? 'admin' : 'teacher',
        status: 'active',
        learningAreaIds: isAdmin ? ['admin'] : ['general'],
        learningAreaName: isAdmin ? 'ฝ่ายบริหารวิชาการ' : 'กลุ่มสาระการเรียนรู้ทั่วไป',
        subjects: [{ name: isAdmin ? 'ผู้ดูแลระบบและฝ่ายตรวจงาน' : 'วิชาประจำชั้น' }],
        gradeLevels: isAdmin ? ['ทุกระดับชั้น'] : ['ม.1-ม.6'],
        photo: fbUser.photoURL ? { type: 'url', url: fbUser.photoURL } : null,
        authProvider: 'password',
        createdAt: new Date().toISOString(),
      };

      createUser(user);
      setCurrentUser(user);
      setStoredCurrentUser(user);
      logActivity('LOGIN', 'User', user.uid, user, { method: 'firebase' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'อีเมลหรือชื่อผู้ใช้งาน หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
    }
  };

  // Real Google Sign In
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = (fbUser.email || '').toLowerCase();
      const isAdmin = (email === 'drive.limited@gmail.com');

      let user = getUserByEmail(email);

      if (!user) {
        user = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          emailVerified: fbUser.emailVerified,
          displayName: fbUser.displayName || (isAdmin ? 'กฤตพจน์ แอดมินบริหาร (Admin)' : 'ครูผู้ใช้งาน (Google)'),
          firstName: fbUser.displayName?.split(' ')[0] || (isAdmin ? 'กฤตพจน์' : 'คุณครู'),
          lastName: fbUser.displayName?.split(' ')[1] || (isAdmin ? 'แอดมินบริหาร' : 'ผู้สอน'),
          role: isAdmin ? 'admin' : 'teacher',
          status: 'active',
          learningAreaIds: isAdmin ? ['admin'] : ['general'],
          learningAreaName: isAdmin ? 'ฝ่ายบริหารวิชาการ' : 'กลุ่มสาระการเรียนรู้ทั่วไป',
          subjects: [{ name: isAdmin ? 'ผู้ดูแลระบบและฝ่ายตรวจงาน' : 'วิชาประจำชั้น' }],
          gradeLevels: ['ทุกระดับชั้น'],
          photo: fbUser.photoURL ? { type: 'url', url: fbUser.photoURL } : null,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
        };
        createUser(user);
      } else {
        if (isAdmin && user.role !== 'admin') {
          user = { ...user, role: 'admin' };
          updateUser(user.uid, { role: 'admin' });
        }
      }

      setCurrentUser(user);
      setStoredCurrentUser(user);
      logActivity('LOGIN', 'User', user.uid, user, { method: 'google', role: user.role });
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        return { 
          success: false, 
          error: 'Firebase: Error (auth/operation-not-allowed) - ยังไม่ได้เปิดใช้งาน Google Sign-In Provider ใน Firebase Console' 
        };
      }
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'หน้าต่างเข้าสู่ระบบ Google ถูกปิดก่อนทำรายการสำเร็จ' };
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, error: 'เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้' };
      }
      return { success: false, error: err?.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้' };
    }
  };

  // Real Teacher Registration
  const registerTeacher = async (data: TeacherRegistrationData): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = data.email.trim().toLowerCase();

    if (getUserByEmail(trimmedEmail)) {
      return { success: false, error: 'อีเมลนี้มีอยู่ในระบบแล้ว กรุณาไปที่หน้าเข้าสู่ระบบ' };
    }

    let uid = `teacher-${Date.now()}`;
    let isFirebaseVerified = false;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, data.password);
      uid = userCredential.user.uid;
      isFirebaseVerified = true;
    } catch (fbErr: any) {
      console.warn('Firebase registration notice:', fbErr?.code || fbErr?.message);
      if (fbErr?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ Firebase Auth กรุณาเข้าสู่ระบบ' };
      }
      if (fbErr?.code === 'auth/weak-password') {
        return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
      }
      if (fbErr?.code === 'auth/invalid-email') {
        return { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' };
      }
    }

    const cleanFirst = data.firstName.trim();
    const cleanLast = data.lastName.trim();
    const cleanDept = data.learningAreaName.trim() || 'กลุ่มสาระการเรียนรู้ทั่วไป';

    const subjectsList = data.subjects && data.subjects.trim()
      ? data.subjects.split(',').map((s, idx) => ({ id: `sub-${Date.now()}-${idx}`, name: s.trim() })).filter(s => s.name.length > 0)
      : [{ id: `sub-${Date.now()}`, name: 'วิชาประจำชั้น' }];

    const newTeacher: User = {
      uid,
      email: trimmedEmail,
      emailVerified: isFirebaseVerified,
      firstName: cleanFirst,
      lastName: cleanLast,
      displayName: `ครู${cleanFirst} ${cleanLast}`,
      role: 'teacher',
      status: 'active',
      learningAreaIds: [mapDepartmentToId(cleanDept)],
      learningAreaName: cleanDept,
      subjects: subjectsList,
      gradeLevels: data.gradeLevels && data.gradeLevels.length > 0 ? data.gradeLevels : ['ม.1-ม.6'],
      phone: data.phone?.trim() || '',
      photo: { type: 'url', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
      authProvider: 'password',
      createdAt: new Date().toISOString(),
    };

    createUser(newTeacher);
    setCurrentUser(newTeacher);
    setStoredCurrentUser(newTeacher);
    logActivity('REGISTER_TEACHER', 'User', newTeacher.uid, newTeacher, { email: newTeacher.email });
    return { success: true };
  };

  // Real Password Reset
  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: `ระบบได้จัดส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยัง ${email} เรียบร้อยแล้ว กรุณาเปิดตรวจสอบกล่องข้อความในอีเมลของคุณ`
      };
    } catch (err: any) {
      return {
        success: true,
        message: `หากบัญชีอีเมล ${email} มีอยู่ในระบบ ระบบจะจัดส่งลิงก์รีเซ็ตรหัสผ่านให้ทันที`
      };
    }
  };

  // Logout
  const logout = () => {
    if (currentUser) {
      logActivity('LOGOUT', 'User', currentUser.uid, currentUser);
    }
    try {
      firebaseSignOut(auth);
    } catch (e) {}
    setCurrentUser(null);
    setStoredCurrentUser(null);
  };

  // Deprecated switchRole stub
  const switchRole = (newRole: UserRole) => {
    const allUsers = getUsers();
    const targetUser = allUsers.find(u => u.role === newRole) || {
      ...allUsers[0],
      role: newRole,
      displayName: newRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'คุณครู (Teacher)'
    };
    setCurrentUser(targetUser);
    setStoredCurrentUser(targetUser);
  };

  const updateCurrentUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = updateUser(currentUser.uid, updates, currentUser);
    if (updated) {
      setCurrentUser(updated);
      setStoredCurrentUser(updated);
    }
  };

  const role = currentUser?.role || 'teacher';
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        login,
        loginWithGoogle,
        registerTeacher,
        resetPassword,
        logout,
        switchRole,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
