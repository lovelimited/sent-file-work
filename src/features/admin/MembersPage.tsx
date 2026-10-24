import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, updateUser, createUser } from '../../lib/storage';
import { User, UserRole } from '../../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Shield, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  Ban, 
  X,
  Mail,
  Phone
} from 'lucide-react';
import Swal from 'sweetalert2';

export const MembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const users = getUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user state
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newPhone, setNewPhone] = useState('');

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

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
        Swal.fire('เปลี่ยนสิทธิ์สำเร็จ', '', 'success').then(() => {
          window.location.reload();
        });
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
        Swal.fire('อัปเดตสถานะสำเร็จ', '', 'success').then(() => {
          window.location.reload();
        });
      }
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newUid = `user-${Date.now()}`;
    const newUser: User = {
      uid: newUid,
      email: newEmail.trim(),
      emailVerified: true,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      displayName: `${newFirstName.trim()} ${newLastName.trim()}`,
      role: newRole,
      status: 'active',
      phone: newPhone.trim(),
      learningAreaIds: ['general'],
      subjects: [{ name: 'วิชาทั่วไป' }],
      gradeLevels: ['ม.1-ม.6'],
      photo: null,
      authProvider: 'password',
      createdAt: new Date().toISOString(),
    };

    createUser(newUser, currentUser);
    setShowAddModal(false);
    Swal.fire('เพิ่มสมาชิกสำเร็จ', '', 'success').then(() => {
      window.location.reload();
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            จัดการสมาชิกและสิทธิ์การเข้าใช้งาน
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดบทบาทคุณครู (Teacher), ผู้นิเทศ (Reviewer), และผู้บริหาร (Admin)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          เพิ่มสมาชิกใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อสมาชิก, อีเมล, เบอร์โทร..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">ทุกบทบาทหน้าที่</option>
          <option value="teacher">คุณครู (Teacher)</option>
          <option value="admin">ผู้ดูแลระบบ/ฝ่ายตรวจ (Admin)</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-4">สมาชิก</th>
                <th className="p-4">บทบาท (Role)</th>
                <th className="p-4">กลุ่มสาระ / วิชา</th>
                <th className="p-4">สถานะบัญชี</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCurrent = u.uid === currentUser?.uid;
                return (
                  <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{u.displayName}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
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
                          u.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="teacher">คุณครู (Teacher)</option>
                        <option value="admin">ผู้ดูแลระบบ/ฝ่ายตรวจ (Admin)</option>
                      </select>
                    </td>

                    <td className="p-4 text-slate-600">
                      {u.subjects?.map(s => s.name).join(', ') || 'ทั่วไป'}
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
                      {!isCurrent && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            u.status === 'active'
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'ระงับ' : 'เปิดใช้งาน'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลสถาบัน</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@school.ac.th"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาท (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-800"
                >
                  <option value="teacher">คุณครู (Teacher)</option>
                  <option value="admin">ผู้ดูแลระบบ/ฝ่ายตรวจ (Admin)</option>
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
