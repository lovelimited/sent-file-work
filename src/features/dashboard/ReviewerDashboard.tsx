import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubmissions, getSubmissionRounds } from '../../lib/storage';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  ArrowRight,
  User,
  GraduationCap
} from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const allSubmissions = getSubmissions();
  const rounds = getSubmissionRounds();

  const [selectedRound, setSelectedRound] = useState<string>('all');

  // Filter submissions assigned to this reviewer or unassigned
  const queueSubmissions = allSubmissions.filter(s => 
    s.status === 'submitted' || s.status === 'under_review'
  );

  const evaluatedSubmissions = allSubmissions.filter(s => 
    s.status === 'passed' || s.status === 'revision_required' || s.status === 'rejected'
  );

  const filteredQueue = selectedRound === 'all' 
    ? queueSubmissions 
    : queueSubmissions.filter(s => s.roundId === selectedRound);

  return (
    <div className="space-y-6">

      {/* Reviewer Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-800 via-indigo-700 to-slate-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/20 mb-3">
            <ClipboardCheck className="w-3.5 h-3.5" /> แผงควบคุมผู้นิเทศและตรวจประเมิน
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            ยินดีต้อนรับ, {currentUser?.displayName}
          </h2>
          <p className="mt-2 text-sm text-indigo-100 leading-relaxed">
            มีงานรอรับการตรวจประเมินตามเกณฑ์มาตรฐาน Rubric จำนวน 
            <span className="font-bold text-amber-300 mx-1.5 text-base">{queueSubmissions.length}</span> 
            รายการ พร้อมบันทึกข้อเสนอแนะเชิงพัฒนา
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">รอรับการตรวจ (ในคิว)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{queueSubmissions.length}</p>
          <p className="text-[11px] text-amber-600/70 mt-1">ต้องการตรวจประเมิน</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">ประเมินผ่านแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {evaluatedSubmissions.filter(s => s.status === 'passed').length}
          </p>
          <p className="text-[11px] text-emerald-600/70 mt-1">ตรงตามเกณฑ์มาตรฐาน</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">แจ้งให้ส่งแก้ไข</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {evaluatedSubmissions.filter(s => s.status === 'revision_required').length}
          </p>
          <p className="text-[11px] text-amber-600/70 mt-1">รอครูส่งเวอร์ชันปรับปรุง</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-600">รวมตรวจแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">{evaluatedSubmissions.length}</p>
          <p className="text-[11px] text-indigo-600/70 mt-1">ผลงานที่บันทึกผลแล้ว</p>
        </div>
      </div>

      {/* Review Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">คิวงานที่ต้องตรวจประเมิน (Review Queue)</h3>
            <p className="text-xs text-slate-500">เลือกงานเพื่อเปิดดูเอกสารและให้คะแนนตามเกณฑ์ประเมิน Rubric</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกรอบการส่งงาน</option>
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-800">ไม่มีงานค้างรอตรวจในขณะนี้</p>
            <p className="text-xs text-slate-400">คุณได้ทำการตรวจประเมินผลงานทั้งหมดในคิวเรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueue.map((sub) => (
              <div 
                key={sub.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-100">
                      v{sub.currentVersionNumber}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                      {sub.title}
                    </h4>
                    <StatusBadge status={sub.status} isLate={sub.isLate} />
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {sub.teacherName}
                    </span>
                    {sub.teacherDepartment && (
                      <span className="text-slate-400 hidden md:inline">
                        • {sub.teacherDepartment}
                      </span>
                    )}
                    <span>
                      • ส่งเมื่อ: {new Date(sub.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    to={`/submissions/${sub.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 transition-all hover:scale-[1.02]"
                  >
                    ตรวจประเมิน <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
