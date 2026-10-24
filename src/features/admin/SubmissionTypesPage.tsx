import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubmissionTypes, saveSubmissionType } from '../../lib/storage';
import { SubmissionType } from '../../types';
import { Sliders, Plus, CheckCircle2, XCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';

export const SubmissionTypesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const types = getSubmissionTypes();

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<SubmissionType | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [allowedExtensions, setAllowedExtensions] = useState('.pdf, .docx');
  const [maxFiles, setMaxFiles] = useState(5);
  const [allowLinks, setAllowLinks] = useState(true);

  const handleOpenAdd = () => {
    setEditingType(null);
    setName('');
    setSlug('');
    setDescription('');
    setAllowedExtensions('.pdf, .docx');
    setMaxFiles(5);
    setAllowLinks(true);
    setShowModal(true);
  };

  const handleOpenEdit = (t: SubmissionType) => {
    setEditingType(t);
    setName(t.name);
    setSlug(t.slug || '');
    setDescription(t.description || '');
    setAllowedExtensions((t.allowedFileExtensions || []).join(', '));
    setMaxFiles(t.maxFilesPerVersion || 5);
    setAllowLinks(t.allowExternalLinks || false);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const extArray = allowedExtensions.split(',').map(s => s.trim()).filter(Boolean);

    const typeData: SubmissionType = {
      id: editingType ? editingType.id : `type-${Date.now()}`,
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      active: editingType ? editingType.active : true,
      sortOrder: editingType ? editingType.sortOrder : types.length + 1,
      allowedFileExtensions: extArray,
      maxFileSizeBytes: 52428800,
      maxFilesPerVersion: maxFiles,
      allowExternalLinks: allowLinks,
      allowResubmitAfterRejected: true,
    };

    saveSubmissionType(typeData, currentUser);
    setShowModal(false);
    Swal.fire('บันทึกสำเร็จ', 'อัปเดตประเภทงานที่เปิดรับเรียบร้อยแล้ว', 'success').then(() => {
      window.location.reload();
    });
  };

  const handleToggleActive = (t: SubmissionType) => {
    if (!currentUser) return;
    saveSubmissionType({ ...t, active: !t.active }, currentUser);
    window.location.reload();
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            ประเภทงานที่เปิดรับ (Submission Types)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดประเภทผลงาน นามสกุลไฟล์ที่อนุญาต จำนวนไฟล์สูงสุด และการเปิด-ปิดรับงาน
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          เพิ่มประเภทงานใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((t) => (
          <div
            key={t.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  t.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {t.active ? 'เปิดรับส่งงาน' : 'ปิดรับชั่วคราว'}
                </span>
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  แก้ไข
                </button>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
              <p className="text-xs text-slate-500">{t.description || 'ไม่มีคำอธิบาย'}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="space-y-0.5">
                <p>ไฟล์: {(t.allowedFileExtensions || ['.pdf', '.docx']).join(', ')}</p>
                <p>สูงสุด {t.maxFilesPerVersion || 5} ไฟล์ • แนบลิงก์ {t.allowExternalLinks ? 'ได้' : 'ไม่ได้'}</p>
              </div>

              <button
                onClick={() => handleToggleActive(t)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  t.active 
                    ? 'text-rose-600 border-rose-200 hover:bg-rose-50' 
                    : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {t.active ? 'ปิดรับ' : 'เปิดรับ'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingType ? 'แก้ไขประเภทงาน' : 'เพิ่มประเภทงานใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อประเภทงาน</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น แผนการจัดการเรียนรู้บูรณาการ"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุลไฟล์ที่อนุญาต (คั่นด้วยจุลภาค)</label>
                <input
                  type="text"
                  value={allowedExtensions}
                  onChange={(e) => setAllowedExtensions(e.target.value)}
                  placeholder=".pdf, .docx, .jpg"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนไฟล์สูงสุด</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={maxFiles}
                    onChange={(e) => setMaxFiles(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={allowLinks}
                      onChange={(e) => setAllowLinks(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    อนุญาตให้แนบลิงก์
                  </label>
                </div>
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
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
