import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, updateUser, createUser, deleteUser, deleteDemoTeachers, getSettings } from '../../lib/storage';
import { syncDataToGoogleSheets } from '../../lib/googleSheetsSync';
import { db } from '../../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { User, UserRole } from '../../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Shield, 
  CheckCircle2, 
  Ban, 
  X,
  Mail,
  Phone,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  GraduationCap,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';

export const MembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const settings = getSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-reload users on any mutation or cloud sync
  React.useEffect(() => {
    const handleDataChanged = () => {
      setUsers(getUsers());
    };
    window.addEventListener('sent_work_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    return () => {
      window.removeEventListener('sent_work_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, []);

  // New user state
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newPhone, setNewPhone] = useState('');
  const [newDepartment, setNewDepartment] = useState('วิทยาศาสตร์และเทคโนโลยี');

  const teachers = users.filter(u => u.role === 'teacher');
  const admins = users.filter(u => u.role === 'admin');

  // Detect demo teacher accounts
  const isDemoAccount = (u: User) => {
    return (
      u.role === 'teacher' && (
        u.uid.startsWith('teacher-') ||
        u.email.endsWith('@school.ac.th') ||
        u.displayName.includes('ครูสมศรี') ||
        u.displayName.includes('ครูสมชาย') ||
        u.displayName.includes('ครูมานะ') ||
        u.displayName.includes('ครูสุดา') ||
        u.displayName.includes('ครูอภิสิทธิ์')
      )
    );
  };

  const demoTeachers = users.filter(isDemoAccount);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.learningAreaName && u.learningAreaName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = 
      roleFilter === 'all' ? true :
      roleFilter === 'demo' ? isDemoAccount(u) :
      u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const reloadData = () => {
    setUsers(getUsers());
  };

  const handleRoleChange = (uid: string, targetRole: UserRole, targetName: string) => {
    if (!currentUser) return;
    Swal.fire({
      title: 'เปลี่ยนบทบาทผู้ใช้งาน?',
      text: `ต้องการเปลี่ยนสิทธิ์ของ "${targetName}" เป็น "${targetRole}" ใช่หรือไม่`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันเปลี่ยนสิทธิ์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#2563eb'
    }).then(res => {
      if (res.isConfirmed) {
        updateUser(uid, { role: targetRole }, currentUser);
        try {
          setDoc(doc(db, 'users', uid), { role: targetRole }, { merge: true }).catch(() => {});
        } catch (e) {}
        reloadData();
        syncDataToGoogleSheets('ROLE_CHANGED');
        Swal.fire('เปลี่ยนสิทธิ์สำเร็จ', '', 'success');
      }
    });
  };

  const handleToggleStatus = (user: User) => {
    if (!currentUser) return;
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    const text = nextStatus === 'disabled' ? 'ระงับการเข้าสู่ระบบ' : 'เปิดใช้งานบัญชี';

    Swal.fire({
      title: `${text}?`,
      text: `คุณต้องการ${text}สำหรับ ${user.displayName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `ยืนยัน${text}`,
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: nextStatus === 'disabled' ? '#e11d48' : '#16a34a'
    }).then(res => {
      if (res.isConfirmed) {
        updateUser(user.uid, { status: nextStatus }, currentUser);
        try {
          setDoc(doc(db, 'users', user.uid), { status: nextStatus }, { merge: true }).catch(() => {});
        } catch (e) {}
        reloadData();
        syncDataToGoogleSheets('STATUS_CHANGED');
        Swal.fire('อัปเดตสถานะสำเร็จ', '', 'success');
      }
    });
  };

  const handleDeleteUser = (user: User) => {
    if (!currentUser) return;
    if (user.uid === currentUser.uid) {
      Swal.fire('ไม่สามารถลบบัญชีตัวเองได้', 'คุณกำลังเข้าสู่ระบบด้วยบัญชีนี้', 'warning');
      return;
    }

    Swal.fire({
      title: 'ยืนยันการลบผู้ใช้งาน?',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-600">
          <p>คุณกำลังจะลบ <b>${user.displayName}</b> (${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ครูผู้สอน'}) ออกจากระบบถาวร</p>
          <p class="text-rose-600 font-medium">⚠️ ข้อมูลภาระงานที่ส่งของครูท่านนี้จะถูกลบออก และระบบจะซิงค์อัปเดตข้อมูลลง Google Sheets ทันที</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบผู้ใช้นี้ทันที',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48'
    }).then(async res => {
      if (res.isConfirmed) {
        deleteUser(user.uid, currentUser);
        try {
          deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
        } catch (e) {}
        reloadData();
        await syncDataToGoogleSheets('USER_DELETED');
        Swal.fire('ลบผู้ใช้งานเรียบร้อยแล้ว', 'ข้อมูลถูกนำออกจากระบบและซิงค์ไปยัง Google Sheets แล้ว', 'success');
      }
    });
  };

  const handleDeleteAllDemo = () => {
    if (!currentUser) return;
    if (demoTeachers.length === 0) {
      Swal.fire('ไม่มีบัญชี Demo', 'ในระบบไม่มีบัญชีครู Demo อยู่แล้ว', 'info');
      return;
    }

    const demoNames = demoTeachers.map(d => `• ${d.displayName}`).join('<br/>');

    Swal.fire({
      title: `ลบบัญชีครู Demo ทั้งหมด (${demoTeachers.length} บัญชี)?`,
      html: `
        <div class="text-left text-xs space-y-2 text-slate-600">
          <p>ระบบจะลบบัญชีครูตัวอย่าง (Demo) ทั้งหมดออกจากระบบ เพื่อให้เหลือเฉพาะครูจริง:</p>
          <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
            ${demoNames}
          </div>
          <p class="text-rose-600 font-semibold">⚠️ รายการงานส่งตัวอย่างจะถูกลบออกด้วย และ Google Sheet จะถูกอัปเดตเป็นจำนวนครูจริงทันที</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันลบบัญชี Demo ทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48'
    }).then(async res => {
      if (res.isConfirmed) {
        setIsSyncing(true);
        demoTeachers.forEach(d => {
          try {
            deleteDoc(doc(db, 'users', d.uid)).catch(() => {});
          } catch (e) {}
        });
        const result = deleteDemoTeachers(currentUser);
        reloadData();
        await syncDataToGoogleSheets('DELETE_ALL_DEMO_USERS');
        setIsSyncing(false);

        Swal.fire({
          title: 'ลบบัญชี Demo สำเร็จ!',
          text: `ลบบัญชีตัวอย่างเรียบร้อยแล้ว ${result.count} บัญชี และซิงค์ Google Sheets แล้ว`,
          icon: 'success',
          confirmButtonColor: '#16a34a'
        });
      }
    });
  };

  // Export Teacher Roster to CSV with UTF-8 BOM
  const handleExportTeachersCSV = () => {
    const teacherList = users.filter(u => u.role === 'teacher');
    if (teacherList.length === 0) {
      Swal.fire('ไม่มีข้อมูลครู', 'ยังไม่มีบัญชีครูผู้สอนในระบบ', 'info');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'อีเมล',
      'ชื่อผู้ใช้',
      'กลุ่มสาระการเรียนรู้',
      'วิชาที่สอน',
      'ระดับชั้น',
      'เบอร์โทรศัพท์',
      'สถานะบัญชี',
      'วันที่สร้างบัญชี'
    ];

    const rows = teacherList.map((t, i) => [
      i + 1,
      `"${t.displayName.replace(/"/g, '""')}"`,
      `"${t.email}"`,
      `"${t.username || '-'}"`,
      `"${t.learningAreaName || 'วิชาการ'}"`,
      `"${(t.subjects?.map(s => s.name).join(', ') || 'ทั่วไป').replace(/"/g, '""')}"`,
      `"${(t.gradeLevels?.join(', ') || '-').replace(/"/g, '""')}"`,
      `"${t.phone || '-'}"`,
      `"${t.createdAt ? new Date(t.createdAt).toLocaleDateString('th-TH') : '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายชื่อครูผู้สอน_${settings.schoolName || 'สารสาสน์วิเทศราชพฤกษ์'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newUid = `user-${Date.now()}`;
    const newUser: User = {
      uid: newUid,
      email: newEmail.trim(),
      emailVerified: true,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      displayName: `ครู${newFirstName.trim()} ${newLastName.trim()}`,
      role: newRole,
      status: 'active',
      phone: newPhone.trim(),
      learningAreaIds: ['general'],
      learningAreaName: newDepartment,
      subjects: [{ name: 'วิชาทั่วไป' }],
      gradeLevels: ['ม.1-ม.6'],
      photo: null,
      authProvider: 'password',
      createdAt: new Date().toISOString(),
    };

    createUser(newUser, currentUser);
    try {
      setDoc(doc(db, 'users', newUser.uid), newUser, { merge: true }).catch(() => {});
    } catch (e) {}
    setShowAddModal(false);
    reloadData();
    await syncDataToGoogleSheets('USER_CREATED');

    Swal.fire('เพิ่มสมาชิกสำเร็จ', `เพิ่ม ${newUser.displayName} เข้าระบบและซิงค์ Google Sheets แล้ว`, 'success');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            จัดการสมาชิกและรายงานรายชื่อครูผู้สอน
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            รายงานรายชื่อคุณครูทุกคนในระบบ แยกสิทธิ์ผู้บริหาร (Admin) และคุณครู (Teacher) พร้อมการจัดการบัญชี
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Delete All Demo button if demo accounts exist */}
          {demoTeachers.length > 0 && (
            <button
              onClick={handleDeleteAllDemo}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="ลบบัญชีครูทดลอง (Demo) 5 บัญชี เพื่อเตรียมระบบให้พร้อมสำหรับครูจริง"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>ลบบัญชี Demo ทั้งหมด ({demoTeachers.length})</span>
            </button>
          )}

          {/* Export CSV button */}
          <button
            onClick={handleExportTeachersCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="ดาวน์โหลดรายงานรายชื่อครูเป็นไฟล์ Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>ส่งออกรายชื่อครู (CSV)</span>
          </button>

          {/* Open Google Sheets direct */}
          <a
            href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetReportId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ดูใน Google Sheets</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Add User button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มสมาชิกใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (คิดแยกครูผู้สอน กับ Admin ชัดเจน) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Teachers Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">จำนวนครูผู้สอนในระบบ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-2xl font-bold text-slate-900">{teachers.length}</p>
            <span className="text-xs text-slate-500 font-medium">ท่าน</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
            ✓ คิดแยก ไม่รวม Admin
          </p>
        </div>

        {/* Card 2: Admins Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ผู้ดูแลระบบ & ฝ่ายตรวจ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-2xl font-bold text-purple-700">{admins.length}</p>
            <span className="text-xs text-slate-500 font-medium">ท่าน</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            สิทธิ์ตรวจประเมิน & จัดการระบบ
          </p>
        </div>

        {/* Card 3: Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รวมผู้ใช้งานทั้งหมดในระบบ</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
            <span className="text-xs text-slate-500 font-medium">บัญชี</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ครู {teachers.length} + แอดมิน {admins.length} ท่าน
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อสมาชิก, กลุ่มสาระ, อีเมล, เบอร์โทร..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">ทุกบทบาทหน้าที่ ({users.length})</option>
          <option value="teacher">คุณครูผู้สอน ({teachers.length})</option>
          <option value="admin">ผู้ดูแลระบบ/Admin ({admins.length})</option>
          {demoTeachers.length > 0 && (
            <option value="demo">เฉพาะบัญชี Demo ({demoTeachers.length})</option>
          )}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-4">ลำดับ & สมาชิก</th>
                <th className="p-4">บทบาท (Role)</th>
                <th className="p-4">กลุ่มสาระการเรียนรู้ / วิชา</th>
                <th className="p-4">เบอร์โทรศัพท์</th>
                <th className="p-4">สถานะบัญชี</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>ไม่พบบัญชีสมาชิกตามเงื่อนไขที่ค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const isCurrent = u.uid === currentUser?.uid;
                  const isDemo = isDemoAccount(u);

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 w-5 text-center">
                            {index + 1}
                          </span>
                          <img
                            src={u.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-slate-900">{u.displayName}</p>
                              {isDemo && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                                  Demo
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                  คุณ
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole, u.displayName)}
                          className={`text-xs rounded-lg px-2.5 py-1 border font-medium focus:outline-none ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <option value="teacher">คุณครู (Teacher)</option>
                          <option value="admin">ผู้ดูแลระบบ/Admin</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <p className="font-medium text-slate-800">{u.learningAreaName || 'กลุ่มบริหารวิชาการ'}</p>
                        <p className="text-[11px] text-slate-400">
                          {u.subjects?.map(s => s.name).join(', ') || 'วิชาทั่วไป'}
                        </p>
                      </td>

                      <td className="p-4 text-slate-600 font-mono text-[11px]">
                        {u.phone || '-'}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {u.status === 'active' ? 'เปิดใช้งาน' : 'ระงับบัญชี'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active/Disabled */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                u.status === 'active'
                                  ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                                  : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'active' ? 'ระงับบัญชีชั่วคราว' : 'เปิดใช้งานบัญชี'}
                            >
                              {u.status === 'active' ? 'ระงับ' : 'เปิดใช้งาน'}
                            </button>
                          )}

                          {/* Delete Button */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="text-xs font-semibold p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบบัญชีผู้ใช้นี้ออกจากระบบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">เพิ่มสมาชิกใหม่ในระบบ</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="เช่น สมใจ"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="เช่น รักเรียน"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลผู้ใช้งาน</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher@school.ac.th หรือ gmail.com"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">กลุ่มสาระการเรียนรู้</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-800"
                >
                  <option value="วิทยาศาสตร์และเทคโนโลยี">วิทยาศาสตร์และเทคโนโลยี</option>
                  <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                  <option value="ภาษาไทย">ภาษาไทย</option>
                  <option value="ภาษาต่างประเทศ">ภาษาต่างประเทศ</option>
                  <option value="สังคมศึกษา ศาสนา และวัฒนธรรม">สังคมศึกษา ศาสนา และวัฒนธรรม</option>
                  <option value="สุขศึกษาและพลศึกษา">สุขศึกษาและพลศึกษา</option>
                  <option value="ศิลปะ">ศิลปะ</option>
                  <option value="การงานอาชีพ">การงานอาชีพ</option>
                  <option value="กิจกรรมพัฒนาผู้เรียน / ทั่วไป">กิจกรรมพัฒนาผู้เรียน / ทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาท (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-800"
                >
                  <option value="teacher">คุณครูผู้สอน (Teacher)</option>
                  <option value="admin">ผู้ดูแลระบบ/Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="081-xxx-xxxx"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  เพิ่มสมาชิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
