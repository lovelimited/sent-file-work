import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubmissionRounds, saveSubmissionRound } from '../../lib/storage';
import { SubmissionRound } from '../../types';
import { CalendarRange, Plus, Calendar, Clock, X } from 'lucide-react';
import Swal from 'sweetalert2';

export const RoundsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const rounds = getSubmissionRounds();

  const [showModal, setShowModal] = useState(false);
  const [editingRound, setEditingRound] = useState<SubmissionRound | null>(null);

  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('2569');
  const [semester, setSemester] = useState('1');
  const [dueAt, setDueAt] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setEditingRound(null);
    setTitle('');
    setAcademicYear('2569');
    setSemester('1');
    setDueAt('');
    setDescription('');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const roundData: SubmissionRound = {
      id: editingRound ? editingRound.id : `round-${Date.now()}`,
      title: title.trim(),
      academicYear: academicYear.trim(),
      semester: semester.trim(),
      submissionTypeIds: ['type-lesson-plan', 'type-classroom-atmosphere'],
      dueAt: dueAt ? new Date(dueAt).toISOString() : new Date().toISOString(),
      isActive: editingRound ? editingRound.isActive : true,
      acceptLate: true,
      targetMode: 'all_teachers',
      description: description.trim(),
    };

    saveSubmissionRound(roundData, currentUser);
    setShowModal(false);
    Swal.fire('บันทึกสำเร็จ', 'อัปเดตรอบการส่งงานเรียบร้อยแล้ว', 'success').then(() => {
      window.location.reload();
    });
  };

  const handleToggleActive = (r: SubmissionRound) => {
    if (!currentUser) return;
    saveSubmissionRound({ ...r, isActive: !r.isActive }, currentUser);
    window.location.reload();
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-blue-600" />
            รอบการส่งงาน (Submission Rounds)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดปีการศึกษา ภาคเรียน กำหนดวันครบกำหนด และตรวจสอบสถานะ Late Flag อัตโนมัติ
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          สร้างรอบการส่งงานใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rounds.map((r) => (
          <div
            key={r.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  r.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {r.isActive ? 'เปิดรับผลงาน' : 'ปิดรอบการส่ง'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ปีการศึกษา {r.academicYear}/{r.semester}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">{r.title}</h4>
              <p className="text-xs text-slate-500">{r.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {r.dueAt ? `ครบกำหนด: ${new Date(r.dueAt).toLocaleDateString('th-TH')}` : 'ไม่ระบุวันสิ้นสุด'}
              </span>

              <button
                onClick={() => handleToggleActive(r)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  r.isActive 
                    ? 'text-rose-600 border-rose-200 hover:bg-rose-50' 
                    : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {r.isActive ? 'ปิดรอบ' : 'เปิดรอบ'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">สร้างรอบการส่งงานใหม่</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อรอบการส่งงาน</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น รอบส่งแผนการสอน ภาคเรียนที่ 1/2569"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ปีการศึกษา</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ภาคเรียน</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วันครบกำหนด (Due Date)</label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุคำชี้แจงสำหรับคุณครู..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  บันทึกรอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
