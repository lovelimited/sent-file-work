import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User as UserIcon, Save, Mail, Shield, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateCurrentUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [subjectName, setSubjectName] = useState(currentUser?.subjects?.[0]?.name || 'วิทยาการคำนวณ');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile({
      displayName: displayName.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      subjects: [{ name: subjectName.trim() }],
    });

    Swal.fire('บันทึกข้อมูลส่วนตัวเรียบร้อย', '', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-blue-600" />
          โปรไฟล์และข้อมูลส่วนตัว
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          แก้ไขชื่อที่แสดง ข้อมูลการติดต่อ และรายวิชาที่รับผิดชอบการสอน
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">

        {/* Avatar header */}
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
            alt={currentUser?.displayName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20 shadow-sm"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900">{currentUser?.displayName}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {currentUser?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                สิทธิ์: {currentUser?.role}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ยืนยันอีเมลแล้ว
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อที่แสดงในระบบ (Display Name)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">วิชาที่รับผิดชอบการสอน</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="เช่น วิทยาการคำนวณ 3, คณิตศาสตร์"
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081-xxx-xxxx"
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};
