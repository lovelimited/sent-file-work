import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubmissions, getSubmissionTopics, getSettings } from '../../lib/storage';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TeacherSubmissionTracker } from '../../components/common/TeacherSubmissionTracker';
import { Link } from 'react-router-dom';
import { 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  FolderPlus,
  AlertCircle
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const settings = getSettings();
  const allSubmissions = getSubmissions();
  const topics = getSubmissionTopics().filter(t => t.isActive);

  // Filter submissions by current teacher
  const mySubmissions = allSubmissions.filter(s => s.teacherUid === currentUser?.uid);

  const passedCount = mySubmissions.filter(s => s.status === 'passed').length;
  const pendingCount = mySubmissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
  const revisionCount = mySubmissions.filter(s => s.status === 'revision_required' || s.status === 'rejected').length;

  const getRemainingDays = (dueIso: string) => {
    const now = new Date().getTime();
    const due = new Date(dueIso).getTime();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: `เลยกำหนดส่ง (${Math.abs(diffDays)} วัน)`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'ครบกำหนดวันนี้!', isOverdue: false, isUrgent: true };
    }
    return { text: `เหลือเวลาอีก ${diffDays} วัน`, isOverdue: false, isUrgent: diffDays <= 3 };
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> ภาคเรียนที่ {settings.semester} ปีการศึกษา {settings.academicYear}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            สวัสดีครับ/ค่ะ, {currentUser?.displayName}
          </h2>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            {settings.welcomeText} สามารถส่งผลงานตามหัวข้อที่แอดมินกำหนด และติดตามสถานะการส่งงานของทุกคนในโรงเรียนได้ที่นี่
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 text-xs font-semibold shadow-md hover:bg-blue-50 transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              ส่งผลงานใหม่
            </Link>
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/60 backdrop-blur-md text-white text-xs font-medium border border-white/20 hover:bg-blue-800 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              ดาวน์โหลดแบบฟอร์ม & คู่มือ
            </Link>
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Section: Topics Assigned by Admin with Deadlines */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-600" />
              หัวข้อเรื่องที่แอดมินเปิดรับส่งขณะนี้ (Active Submission Topics)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดส่งและคำชี้แจงจากฝ่ายบริหารวิชาการ คลิกเลือกหัวข้อเพื่อส่งผลงานตามกำหนด
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 w-fit">
            เปิดรับ {topics.length} หัวข้อ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => {
            const myWork = mySubmissions.find(s => s.topicId === topic.id);
            const remaining = getRemainingDays(topic.dueDate);

            return (
              <div 
                key={topic.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {topic.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      remaining.isOverdue 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : remaining.isUrgent
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {remaining.text}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {topic.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>กำหนดส่ง: {new Date(topic.dueDate).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit'
                    })}</span>
                  </div>
                </div>

                {/* Teacher submission status & action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {myWork ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">ส่งแล้ว</span>
                      <Link
                        to={`/submissions/${myWork.id}`}
                        className="text-[11px] text-blue-600 hover:underline ml-1"
                      >
                        (ดูงาน)
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>ยังไม่ได้ส่ง</span>
                    </div>
                  )}

                  <Link
                    to={`/submit?topicId=${topic.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-all shadow-sm"
                  >
                    {myWork ? 'ส่งอัปเดต' : 'ส่งงาน'}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Personal KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ผลงานของฉันทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{mySubmissions.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">รายการงานที่ส่งแล้ว</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">อนุมัติผ่านแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{passedCount}</p>
          <p className="text-[11px] text-emerald-600/70 mt-1">แอดมินตรวจผ่านเรียบร้อย</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">รอการตรวจสอบ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-amber-600/70 mt-1">อยู่ในคิวการตรวจ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">ต้องส่งแก้ไขใหม่</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{revisionCount}</p>
          <p className="text-[11px] text-rose-600/70 mt-1">มีข้อเสนอแนะให้ปรับปรุง</p>
        </div>
      </div>

      {/* Main Section: Submission Tracker for Everyone */}
      <TeacherSubmissionTracker />

      {/* Recent Personal Submissions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">งานที่ส่งล่าสุดของฉัน</h3>
            <p className="text-xs text-slate-500">ผลงานและข้อเสนอแนะจากแอดมินฝ่ายตรวจ</p>
          </div>
          <Link 
            to="/submissions" 
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ดูงานของฉันทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            คุณยังไม่มีรายการงานที่ส่งในขณะนี้
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mySubmissions.slice(0, 4).map((sub) => (
              <Link
                key={sub.id}
                to={`/submissions/${sub.id}`}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      v{sub.currentVersionNumber}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {sub.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    หัวข้อ: {sub.topicTitle || 'ผลงานครู'} • ส่งเมื่อ: {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={sub.status} isLate={sub.isLate} />
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
