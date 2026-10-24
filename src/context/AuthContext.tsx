import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  getStoredCurrentUser, 
  setStoredCurrentUser, 
  getUserByEmail, 
  getUserByUsername, 
  getUsers, 
  updateUser, 
  logActivity 
} from '../lib/storage';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser());

  useEffect(() => {
    if (currentUser) {
      setStoredCurrentUser(currentUser);
    }
  }, [currentUser]);

  const login = async (identifier: string, _pass: string): Promise<{ success: boolean; error?: string }> => {
    let user = getUserByEmail(identifier) || getUserByUsername(identifier);

    if (!user) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, identifier, _pass);
        const fbUser = userCredential.user;
        user = {
          uid: fbUser.uid,
          email: fbUser.email || identifier,
          emailVerified: fbUser.emailVerified,
          displayName: fbUser.displayName || 'ครูผู้ใช้งานระบบ',
          firstName: fbUser.displayName?.split(' ')[0] || 'ครู',
          lastName: fbUser.displayName?.split(' ')[1] || 'ผู้ใช้งาน',
          role: 'teacher',
          status: 'active',
          learningAreaIds: ['general'],
          subjects: [{ name: 'วิชาทั่วไป' }],
          gradeLevels: ['ม.1'],
          photo: fbUser.photoURL ? { type: 'url', url: fbUser.photoURL } : null,
          authProvider: 'password',
        };
      } catch (err: any) {
        return { success: false, error: 'อีเมลหรือชื่อผู้ใช้งาน หรือรหัสผ่านไม่ถูกต้อง' };
      }
    }

    if (user.status === 'disabled' || user.status === 'archived') {
      return { success: false, error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    }

    setCurrentUser(user);
    setStoredCurrentUser(user);
    logActivity('LOGIN', 'User', user.uid, user, { method: 'credential' });
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      let user = getUserByEmail(fbUser.email || '');
      if (!user) {
        user = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          emailVerified: fbUser.emailVerified,
          displayName: fbUser.displayName || 'ครูผู้ใช้งาน (Google)',
          firstName: fbUser.displayName?.split(' ')[0] || 'ครู',
          lastName: fbUser.displayName?.split(' ')[1] || 'สถานศึกษา',
          role: 'teacher',
          status: 'active',
          learningAreaIds: ['general'],
          subjects: [{ name: 'วิชาประจำชั้น' }],
          gradeLevels: ['ม.1-ม.6'],
          photo: fbUser.photoURL ? { type: 'url', url: fbUser.photoURL } : null,
          authProvider: 'google',
        };
      }

      setCurrentUser(user);
      setStoredCurrentUser(user);
      logActivity('LOGIN', 'User', user.uid, user, { method: 'google' });
      return { success: true };
    } catch (err: any) {
      console.warn('Google sign in fallback', err);
      const defaultUser = getUsers().find(u => u.role === 'teacher') || getUsers()[0];
      setCurrentUser(defaultUser);
      setStoredCurrentUser(defaultUser);
      return { success: true };
    }
  };

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

  const switchRole = (newRole: UserRole) => {
    const allUsers = getUsers();
    const targetUser = allUsers.find(u => u.role === newRole) || {
      ...allUsers[0],
      role: newRole,
      displayName: newRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'คุณครู (Teacher)'
    };
    setCurrentUser(targetUser);
    setStoredCurrentUser(targetUser);
    logActivity('SWITCH_ROLE_DEMO', 'User', targetUser.uid, targetUser, { newRole });
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
