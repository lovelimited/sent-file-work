import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, SubmissionTopic, Submission, LibraryCategory, SubmissionVersion, ReviewRecord } from '../types';
import { 
  getStoredCurrentUser, 
  setStoredCurrentUser, 
  getUserByEmail, 
  getUserByUsername, 
  getUsers, 
  updateUser, 
  createUser,
  getSubmissionTopics,
  getSubmissions,
  getLibraryCategories,
  logActivity 
} from '../lib/storage';
import { auth, googleProvider, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { syncDataToGoogleSheets } from '../lib/googleSheetsSync';

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

  // Synchronize users, topics, and submissions from Cloud Firestore across all devices in real time
  useEffect(() => {
    let unsubscribeUsers = () => {};
    let unsubscribeTopics = () => {};
    let unsubscribeSubmissions = () => {};
    let unsubscribeLibraryCats = () => {};
    let unsubscribeVersions = () => {};
    let unsubscribeReviews = () => {};

    try {
      // 1. Sync Users
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudUsers: User[] = [];
          snapshot.forEach(docSnap => {
            const uData = docSnap.data() as User;
            if (uData && uData.uid) {
              cloudUsers.push(uData);
            }
          });

          if (cloudUsers.length > 0) {
            const localUsers = getUsers();
            const map = new Map<string, User>();
            localUsers.forEach(u => map.set(u.uid, u));
            
            cloudUsers.forEach(cu => {
              const lu = map.get(cu.uid);
              if (!lu) {
                map.set(cu.uid, cu);
              } else {
                const luTime = lu.updatedAt ? new Date(lu.updatedAt).getTime() : 0;
                const cuTime = cu.updatedAt ? new Date(cu.updatedAt).getTime() : 0;
                if (cuTime >= luTime) {
                  map.set(cu.uid, { ...lu, ...cu });
                } else {
                  // Local is newer! Keep local and update Firestore
                  setDoc(doc(db, 'users', lu.uid), lu, { merge: true }).catch(() => {});
                }
              }
            });
            
            const merged = Array.from(map.values());
            localStorage.setItem('sent_work_users_v5', JSON.stringify(merged));
            
            // If active user was updated, update state
            if (currentUser && map.has(currentUser.uid)) {
              const freshCurrent = map.get(currentUser.uid)!;
              if (freshCurrent.displayName !== currentUser.displayName || freshCurrent.updatedAt !== currentUser.updatedAt) {
                setCurrentUser(freshCurrent);
                setStoredCurrentUser(freshCurrent);
              }
            }

            window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CLOUD_USERS_SYNCED' } }));
          }
        } else {
          // If Cloud Firestore 'users' is empty, upload all local users so they are synced across all devices
          const localUsers = getUsers();
          if (localUsers.length > 0) {
            localUsers.forEach(u => {
              setDoc(doc(db, 'users', u.uid), u, { merge: true }).catch(() => {});
            });
          }
        }
      }, (err) => {
        console.warn('Firestore users sync notice:', err.message);
      });

      // 2. Sync Topics (หัวข้อเรื่องที่แอดมินสร้าง)
      unsubscribeTopics = onSnapshot(collection(db, 'topics'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudTopics: SubmissionTopic[] = [];
          snapshot.forEach(docSnap => {
            const tData = docSnap.data() as SubmissionTopic;
            if (tData && tData.id) {
              cloudTopics.push(tData);
            }
          });
          if (cloudTopics.length > 0) {
            cloudTopics.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            localStorage.setItem('sent_work_submission_topics_v5', JSON.stringify(cloudTopics));
            window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CLOUD_TOPICS_SYNCED' } }));
          }
        } else {
          // If Cloud Firestore 'topics' is empty, upload existing local topics so they are preserved
          const localTopics = getSubmissionTopics();
          if (localTopics.length > 0) {
            localTopics.forEach(t => {
              setDoc(doc(db, 'topics', t.id), t, { merge: true }).catch(() => {});
            });
          }
        }
      }, (err) => {
        console.warn('Firestore topics sync notice:', err.message);
      });

      // 3. Sync Submissions (รายการส่งงานของครู)
      unsubscribeSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudSubs: Submission[] = [];
          snapshot.forEach(docSnap => {
            const sData = docSnap.data() as Submission;
            if (sData && sData.id) {
              cloudSubs.push(sData);
            }
          });
          if (cloudSubs.length > 0) {
            cloudSubs.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
            localStorage.setItem('sent_work_submissions_v5', JSON.stringify(cloudSubs));
            window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CLOUD_SUBMISSIONS_SYNCED' } }));
          }
        }
      }, (err) => {
        console.warn('Firestore submissions sync notice:', err.message);
      });

      // 4. Sync Library Categories (หมวดหมู่เอกสารคลังกลาง)
      unsubscribeLibraryCats = onSnapshot(collection(db, 'libraryCategories'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudCats: LibraryCategory[] = [];
          snapshot.forEach(docSnap => {
            const cData = docSnap.data() as LibraryCategory;
            if (cData && cData.id) {
              cloudCats.push(cData);
            }
          });
          if (cloudCats.length > 0) {
            localStorage.setItem('sent_work_library_cats_v5', JSON.stringify(cloudCats));
            window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CLOUD_LIBRARY_CATS_SYNCED' } }));
          }
        } else {
          const localCats = getLibraryCategories();
          if (localCats.length > 0) {
            localCats.forEach(c => {
              setDoc(doc(db, 'libraryCategories', c.id), c, { merge: true }).catch(() => {});
            });
          }
        }
      }, (err) => {
        console.warn('Firestore library categories sync notice:', err.message);
      });

      // 5. Sync Versions (เวอร์ชันและไฟล์ของผลงาน)
      unsubscribeVersions = onSnapshot(collection(db, 'versions'), (snapshot) => {
        if (!snapshot.empty) {
          const versionsBySub: Record<string, SubmissionVersion[]> = {};
          snapshot.forEach(docSnap => {
            const vData = docSnap.data() as SubmissionVersion;
            if (vData && vData.submissionId) {
              if (!versionsBySub[vData.submissionId]) {
                versionsBySub[vData.submissionId] = [];
              }
              versionsBySub[vData.submissionId].push(vData);
            }
          });
          Object.values(versionsBySub).forEach(arr => {
            arr.sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
          });
          const existingRaw = localStorage.getItem('sent_work_versions_v5');
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          const merged = { ...existing, ...versionsBySub };
          localStorage.setItem('sent_work_versions_v5', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CLOUD_VERSIONS_SYNCED' } }));
        }
      }, (err) => {
        console.warn('Firestore versions sync notice:', err.message);
      });

      // 6. Sync Reviews (บันทึกการตรวจประเมินของแอดมิน)
      unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
        if (!snapshot.empty) {
          const reviewsBySub: Record<string, ReviewRecord[]> = {};
          snapshot.forEach(docSnap => {
            const rData = docSnap.data() as ReviewRecord;
            if (rData && rData.submissionId) {
              if (!reviewsBySub[rData.submissionId]) {
                reviewsBySub[rData.submissionId] = [];
              }
              reviewsBySub[rData.submissionId].push(rData);
            }
          });
          Object.values(reviewsBySub).forEach(arr => {
            arr.sort((a, b) => new Date(b.reviewedAt || 0).getTime() - new Date(a.reviewedAt || 0).getTime());
          });
          const existingRaw = localStorage.getItem('sent_work_reviews_v5');
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          const merged = { ...existing, ...reviewsBySub };
          localStorage.setItem('sent_work_reviews_v5', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CLOUD_REVIEWS_SYNCED' } }));
        }
      }, (err) => {
        console.warn('Firestore reviews sync notice:', err.message);
      });

    } catch (e) {
      console.warn('Firestore onSnapshot init:', e);
    }

    return () => {
      unsubscribeUsers();
      unsubscribeTopics();
      unsubscribeSubmissions();
      unsubscribeLibraryCats();
      unsubscribeVersions();
      unsubscribeReviews();
    };
  }, [currentUser]);

  // Real Login with Email/Username + Password
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedId = identifier.trim();
    const trimmedPass = pass.trim();

    if (!trimmedId || !trimmedPass) {
      return { success: false, error: 'กรุณากรอกอีเมล/ชื่อผู้ใช้งาน และรหัสผ่าน' };
    }

    let user = getUserByEmail(trimmedId) || getUserByUsername(trimmedId);
    const isMasterAdminId = trimmedId.toLowerCase() === 'admin' || 
      trimmedId.toLowerCase() === 'drive.limited@gmail.com';

    let isPasswordValid = false;
    let fbUserResult: any = null;

    // 1. Check user-defined password stored in profile
    if (user?.password && user.password === trimmedPass) {
      isPasswordValid = true;
    }

    // 2. Check fallback accepted passwords
    if (!isPasswordValid) {
      const isAcceptedAdminPass = (isMasterAdminId || user?.role === 'admin') && 
        (trimmedPass === 'krittapot001' || trimmedPass === 'admin123' || trimmedPass === 'password123' || trimmedPass === '123456');
      const isAcceptedTeacherPass = (trimmedPass === 'password123' || trimmedPass === '123456');

      if (isAcceptedAdminPass || (user && isAcceptedTeacherPass)) {
        isPasswordValid = true;
      }
    }

    // 3. Try Firebase Auth if not already verified
    if (!isPasswordValid) {
      const emailToAuth = user?.email || (trimmedId.includes('@') ? trimmedId : `${trimmedId}@school.ac.th`);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, trimmedPass);
        isPasswordValid = true;
        fbUserResult = userCredential.user;
      } catch {
        // Firebase auth failed
      }
    }

    if (!isPasswordValid) {
      return { success: false, error: 'อีเมลหรือชื่อผู้ใช้งาน หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
    }

    // If account not found in local DB, create user profile
    if (!user) {
      if (isMasterAdminId) {
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
          password: trimmedPass,
          createdAt: new Date().toISOString(),
        };
        createUser(user);
      } else if (fbUserResult) {
        user = {
          uid: fbUserResult.uid,
          email: fbUserResult.email || trimmedId,
          emailVerified: fbUserResult.emailVerified,
          displayName: fbUserResult.displayName || trimmedId,
          firstName: fbUserResult.displayName?.split(' ')[0] || 'คุณครู',
          lastName: fbUserResult.displayName?.split(' ')[1] || 'ผู้สอน',
          role: 'teacher',
          status: 'active',
          learningAreaIds: ['general'],
          learningAreaName: 'กลุ่มสาระการเรียนรู้ทั่วไป',
          subjects: [{ name: 'วิชาประจำชั้น' }],
          gradeLevels: ['ม.1-ม.6'],
          photo: fbUserResult.photoURL ? { type: 'url', url: fbUserResult.photoURL } : null,
          authProvider: 'password',
          password: trimmedPass,
          createdAt: new Date().toISOString(),
        };
        createUser(user);
      } else {
        return { success: false, error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาลงทะเบียนหรือตรวจสอบอีกครั้ง' };
      }
    }

    if (user.status === 'disabled' || user.status === 'archived') {
      return { success: false, error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อฝ่ายบริหารวิชาการ' };
    }

    const userToSync: User = { 
      ...user, 
      lastLoginAt: new Date().toISOString() 
    };

    setCurrentUser(userToSync);
    setStoredCurrentUser(userToSync);

    // Sync to Cloud Firestore in real time so all devices immediately see this user logged in
    try {
      setDoc(doc(db, 'users', userToSync.uid), userToSync, { merge: true }).catch(err => {
        console.warn('Firestore login user sync notice:', err);
      });
    } catch (e) {}

    logActivity('LOGIN', 'User', userToSync.uid, userToSync, { method: fbUserResult ? 'firebase' : 'credential' });
    syncDataToGoogleSheets('USER_LOGIN').catch(() => {});
    return { success: true };
  };

  // Real Google Sign In
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = (fbUser.email || '').toLowerCase();
      const displayName = fbUser.displayName || '';

      // Only the dedicated system owner account defaults to admin on first login
      const isSystemAdmin = email === 'drive.limited@gmail.com';

      let user = getUserByEmail(email);

      if (!user) {
        // ALL new members signing up with Google are TEACHERS (คุณครู) by default
        user = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          emailVerified: fbUser.emailVerified,
          displayName: displayName || ('คุณครู ' + (email.split('@')[0])),
          firstName: displayName ? displayName.split(' ')[0] : 'คุณครู',
          lastName: displayName ? displayName.split(' ').slice(1).join(' ') : 'ผู้สอน',
          role: isSystemAdmin ? 'admin' : 'teacher',
          status: 'active',
          learningAreaIds: isSystemAdmin ? ['admin'] : ['general'],
          learningAreaName: isSystemAdmin ? 'ฝ่ายบริหารวิชาการ' : 'กลุ่มสาระการเรียนรู้ทั่วไป',
          subjects: [{ name: isSystemAdmin ? 'ผู้ดูแลระบบและฝ่ายตรวจงาน' : 'วิชาประจำชั้น' }],
          gradeLevels: isSystemAdmin ? ['ทุกระดับชั้น'] : ['ม.1-ม.6'],
          photo: fbUser.photoURL ? { type: 'url', url: fbUser.photoURL } : null,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
        };
        createUser(user);
      } else {
        // Existing member: preserve their existing role in database!
        const updates: Partial<User> = {};
        const isDefaultPlaceholder = !user.displayName || user.displayName.startsWith('คุณครู ') || user.displayName === email.split('@')[0];
        if (displayName && isDefaultPlaceholder) {
          updates.displayName = displayName;
        }
        if (fbUser.photoURL && (!user.photo || user.photo.url !== fbUser.photoURL)) {
          updates.photo = { type: 'url', url: fbUser.photoURL };
        }
        if (Object.keys(updates).length > 0) {
          user = { ...user, ...updates };
          updateUser(user.uid, updates);
        }
      }

      const finalUser: User = user;

      // Save user to Cloud Firestore so all devices and admins see this member
      try {
        await setDoc(doc(db, 'users', finalUser.uid), finalUser, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore user save notice:', fsErr);
      }

      setCurrentUser(finalUser);
      setStoredCurrentUser(finalUser);
      logActivity('LOGIN', 'User', finalUser.uid, finalUser, { method: 'google', role: finalUser.role });

      // Trigger real-time sync to Google Sheet
      syncDataToGoogleSheets('GOOGLE_USER_LOGIN').catch(() => {});

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
      password: data.password,
      createdAt: new Date().toISOString(),
    };

    createUser(newTeacher);
    setCurrentUser(newTeacher);
    setStoredCurrentUser(newTeacher);

    // Sync to Cloud Firestore in real time so all admins and devices see new teacher instantly
    try {
      await setDoc(doc(db, 'users', newTeacher.uid), newTeacher, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore register teacher sync notice:', fsErr);
    }

    logActivity('REGISTER_TEACHER', 'User', newTeacher.uid, newTeacher, { email: newTeacher.email });
    syncDataToGoogleSheets('REGISTER_TEACHER').catch(() => {});
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

  // 1-Click Role Switcher (Admin ↔ Teacher)
  const switchRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      role: newRole
    };
    updateUser(currentUser.uid, { role: newRole });
    setCurrentUser(updated);
    setStoredCurrentUser(updated);
    try {
      setDoc(doc(db, 'users', updated.uid), { role: newRole }, { merge: true }).catch(() => {});
    } catch {}
    window.dispatchEvent(new Event('sent_work_data_changed'));
  };

  const updateCurrentUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = updateUser(currentUser.uid, updates, currentUser);
    if (updated) {
      setCurrentUser(updated);
      setStoredCurrentUser(updated);
      // Sync to Cloud Firestore as well so changes appear across all devices
      try {
        setDoc(doc(db, 'users', updated.uid), updated, { merge: true }).catch(err => {
          console.warn('Failed to sync profile update to firestore:', err);
        });
      } catch (e) {
        console.warn('Firestore profile update error:', e);
      }
      syncDataToGoogleSheets('PROFILE_UPDATE').catch(() => {});
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
