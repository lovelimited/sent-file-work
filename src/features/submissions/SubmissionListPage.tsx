import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubmissions, getSubmissionTopics } from '../../lib/storage';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  UploadCloud, 
  ArrowRight,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

export const SubmissionListPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const allSubmissions = getSubmissions();
  const topics = getSubmissionTopics();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  // Role scoping: Admin sees all, teachers see ONLY their own submissions
  const scopedSubmissions = role === 'admin'
    ? allSubmissions
    : allSubmissions.filter(s => s.teacherUid === currentUser?.uid);

  // Filter
  const filteredSubmissions = scopedSubmissions.filter(sub => {
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.topicTitle && sub.topicTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.teacherDepartment && sub.teacherDepartment.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : sub.status === statusFilter;
    const matchesTopic = topicFilter === 'all' ? true : sub.topicId === topicFilter;

    return matchesSearch && matchesStatus && matchesTopic;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {role === 'teacher' ? 'รายการงานของฉัน' : 'รายการส่งงานทั้งหมดในสถานศึกษา'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'teacher' 
              ? 'ติดตามประวัติการส่งงาน ผลการประเมิน และเวอร์ชันที่ได้รับการอนุมัติ' 
              : 'ตรวจสอบและติดตามสถานะการส่งแผนการสอนของคณะครูทุกคน'}
          </p>
        </div>

        {role === 'teacher' && (
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
            ส่งงานใหม่
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อแผนการสอน, ชื่อครูผู้สอน, กลุ่มสาระ..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Topic Filter */}
          <div className="w-full md:w-auto">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกหัวข้อที่แอดมินมอบหมาย</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>[{t.category}] {t.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium text-[11px] mr-1">สถานะ:</span>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'submitted', label: 'รอรับการตรวจ' },
            { id: 'under_review', label: 'กำลังตรวจ' },
            { id: 'passed', label: 'ผ่านเกณฑ์' },
            { id: 'revision_required', label: 'ต้องส่งแก้ไข' },
            { id: 'rejected', label: 'ไม่ผ่าน' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === chip.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-800">ไม่พบรายการผลงานที่ตรงตามเงื่อนไข</p>
            <p className="text-xs text-slate-400">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSubmissions.map((sub) => {
              return (
                <div
                  key={sub.id}
                  className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                        v{sub.currentVersionNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                        {sub.topicTitle || 'ผลงานครู'}
                      </span>
                      <Link
                        to={`/submissions/${sub.id}`}
                        className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
                      >
                        {sub.title}
                      </Link>
                      <StatusBadge status={sub.status} isLate={sub.isLate} />
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {sub.teacherName}
                      </span>
                      {sub.teacherDepartment && (
                        <span className="text-slate-400 hidden sm:inline">
                          • {sub.teacherDepartment}
                        </span>
                      )}
                      <span>
                        • ส่งเมื่อ: {new Date(sub.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {role !== 'admin' && sub.teacherUid !== currentUser?.uid && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (🔒 ไฟล์สงวนสิทธิ์แอดมิน)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Link
                      to={`/submissions/${sub.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-medium transition-colors"
                    >
                      ดูรายละเอียด <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
