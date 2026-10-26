import React, { useState } from 'react';
import { 
  getFullSubmissionMatrix, 
  MatrixCellStatus 
} from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter, 
  FileText, 
  Lock,
  ArrowRight,
  Calendar,
  PlusCircle,
  Sparkles,
  BarChart3,
  Columns,
  Info,
  Table,
  LayoutGrid,
  XCircle,
  Eye,
  Send,
  Check,
  X,
  AlertTriangle,
  ListTodo,
  FileSpreadsheet,
  Download,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import Swal from 'sweetalert2';
import { syncDataToGoogleSheets } from '../../lib/googleSheetsSync';
import { DocumentViewerModal } from './DocumentViewerModal';

export const TeacherSubmissionTracker: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [, setMatrixVersion] = useState(0);
  const matrixData = getFullSubmissionMatrix();
  const { topics, rows, totalTeachers, topicStats } = matrixData;

  React.useEffect(() => {
    const handleDataChanged = () => {
      setMatrixVersion(v => v + 1);
    };
    window.addEventListener('sent_work_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    return () => {
      window.removeEventListener('sent_work_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, []);

  // View mode: 'standard' (แนวนอน อ่านง่าย), 'topics' (แยกติดตามรายหัวข้องาน), 'compact' (สมุดตรวจกระชับ)
  const [viewMode, setViewMode] = useState<'standard' | 'topics' | 'compact'>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'uncompleted' | 'completed'>('all');
  const [activeTopicTab, setActiveTopicTab] = useState<string>(topics[0]?.id || '');
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);

  const [selectedCell, setSelectedCell] = useState<{
    teacherName: string;
    topicTitle: string;
    category: string;
    cell: MatrixCellStatus;
  } | null>(null);

  const [viewerFile, setViewerFile] = useState<any | null>(null);

  // Unique departments for filtering
  const departments = Array.from(
    new Set(rows.map(r => r.teacher.learningAreaName || 'ทั่วไป'))
  );

  // Filter rows
  const filteredRows = rows.filter(row => {
    const matchesSearch = 
      row.teacher.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.teacher.learningAreaName && row.teacher.learningAreaName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = deptFilter === 'all' ? true : row.teacher.learningAreaName === deptFilter;

    const matchesCompletion = 
      completionFilter === 'all' ? true :
      completionFilter === 'completed' ? row.submittedCount === row.totalTopics :
      row.submittedCount < row.totalTopics; // uncompleted

    return matchesSearch && matchesDept && matchesCompletion;
  });

  // Calculate overall metrics
  const totalSubmissionsAcrossAll = rows.reduce((acc, r) => acc + r.submittedCount, 0);
  const totalPossible = totalTeachers * (topics.length || 1);
  const overallPercentage = totalPossible > 0 ? Math.round((totalSubmissionsAcrossAll / totalPossible) * 100) : 0;
  const completedTeachersCount = rows.filter(r => r.submittedCount === r.totalTopics && r.totalTopics > 0).length;
  const uncompletedTeachersCount = totalTeachers - completedTeachersCount;

  // Selected topic for 'topics' view mode
  const currentTopic = topics.find(t => t.id === activeTopicTab) || topics[0];
  const currentTopicStat = currentTopic ? topicStats[currentTopic.id] || { submittedCount: 0, passedCount: 0, completionRate: 0 } : null;

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const handleManualSyncSheets = async () => {
    setIsSyncingSheets(true);
    const res = await syncDataToGoogleSheets('TRACKER_SYNC');
    setIsSyncingSheets(false);
    Swal.fire({
      title: 'ซิงค์ข้อมูลลง Google Sheets สำเร็จ!',
      text: `ส่งออกข้อมูลเข้าสู่ระบบ Google Sheets เรียบร้อยแล้ว (${res.rowCount} รายการ)`,
      icon: 'success',
      confirmButtonText: 'เปิดดูเอกสาร Google Sheets',
      showCancelButton: true,
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#16a34a'
    }).then(r => {
      if (r.isConfirmed) {
        window.open('https://docs.google.com/spreadsheets/d/1N5t1SP33BkvUrc00lrjEvnRbfi1cf1JuesNJezVyZqU', '_blank');
      }
    });
  };

  const handleExportDashboardCSV = () => {
    if (rows.length === 0) return;
    const headers = [
      '"ลำดับ"',
      '"ชื่อ-นามสกุลครูผู้สอน"',
      '"กลุ่มสาระการเรียนรู้"',
      ...topics.map(t => `"${t.title.replace(/"/g, '""')}"`),
      '"ส่งแล้ว (งาน)"',
      '"ภาระงานทั้งหมด"',
      '"คิดเป็น %"',
      '"สถานะภาพรวม"'
    ];

    const csvRows = rows.map((r, idx) => {
      const topicCols = topics.map(t => {
        const c = r.cells[t.id];
        if (c?.status === 'passed') return '"✓ ผ่านแล้ว"';
        if (c?.status === 'submitted') return '"⏳ รอตรวจ"';
        if (c?.status === 'revision_required') return '"⚠️ แก้ไข"';
        return '"❌ ยังไม่ส่ง"';
      });

      const overall = r.submittedCount === topics.length && topics.length > 0
        ? '"✓ ส่งครบ 100%"'
        : r.submittedCount > 0 ? `"${r.submittedCount}/${topics.length} งาน"` : '"❌ ยังไม่ส่ง"';

      return [
        idx + 1,
        `"${r.teacher.displayName}"`,
        `"${r.teacher.learningAreaName || 'วิชาการ'}"`,
        ...topicCols,
        r.submittedCount,
        topics.length,
        `"${r.completionRate}%"`,
        overall
      ].join(',');
    });

    // Summary footer row
    const footerCols = topics.map(t => {
      const stat = topicStats[t.id];
      return stat ? `"${stat.submittedCount}/${rows.length} คน (${stat.completionRate}%)"` : '"-"';
    });
    const footerRow = [
      '""',
      '"สรุปจำนวนครูที่ส่งในแต่ละหัวข้อ"',
      '""',
      ...footerCols,
      `"${rows.reduce((acc, curr) => acc + curr.submittedCount, 0)} งาน"`,
      `"${rows.length * topics.length} งาน"`,
      `"${overallPercentage}%"`,
      '"ภาพรวมทั้งโรงเรียน"'
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows, footerRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ตาราง_Dashboard_การส่งงานครู_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden w-full max-w-full min-w-0 space-y-4">
      
      {/* Tracker Top Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Table className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  ตารางติดตามการส่งงานวิชาการ
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 shadow-2xs">
                  <Lock className="w-3 h-3 text-amber-600" /> ไฟล์เปิดดูได้เฉพาะแอดมิน
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามสถานะการส่งงานของคณะครูทุกคน ตรวจสอบง่าย ชัดเจน ไม่ต้องเอียงคออ่าน
              </p>
            </div>
          </div>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
            ครูทั้งหมด {totalTeachers} ท่าน
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
            เปิดรับ {topics.length} หัวข้อ
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ส่งครบ {completedTeachersCount} ท่าน
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs">
            รวม {overallPercentage}%
          </div>
          {/* Admin-only Operations: Google Sheets, Live Sync, and CSV Export */}
          {role === 'admin' && (
            <>
              <a
                href="https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="เปิดโฟลเดอร์ Google Drive รวมศูนย์ของสถานศึกษา (เฉพาะแอดมิน)"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Drive</span>
              </a>

              <a
                href="https://docs.google.com/spreadsheets/d/1N5t1SP33BkvUrc00lrjEvnRbfi1cf1JuesNJezVyZqU"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="เปิดดูตาราง Dashboard บน Google Sheets (เฉพาะแอดมิน)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Sheets</span>
              </a>

              <button
                onClick={handleManualSyncSheets}
                disabled={isSyncingSheets}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="กดสั่งซิงค์ข้อมูลตาราง Dashboard ลง Google Sheets ทันที (เฉพาะแอดมิน)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                <span>{isSyncingSheets ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</span>
              </button>

              <button
                onClick={handleExportDashboardCSV}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ส่งออกตาราง Dashboard เมทริกซ์ เป็นไฟล์ CSV (เฉพาะแอดมิน)"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>ส่งออก Dashboard (CSV)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Switcher Tabs & Quick Filters Bar */}
      <div className="px-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('standard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                viewMode === 'standard'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>ตารางแนวนอน อ่านง่าย (แนะนำ)</span>
            </button>

            <button
              onClick={() => setViewMode('topics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                viewMode === 'topics'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>ติดตามรายหัวข้องาน</span>
            </button>

            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                viewMode === 'compact'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-blue-600" />
              <span>สมุดตรวจแบบกระชับ</span>
            </button>
          </div>

          {/* Quick Filter: All vs Pending Follow-up */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">แสดงผล:</span>
            <button
              onClick={() => setCompletionFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                completionFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({rows.length})
            </button>
            <button
              onClick={() => setCompletionFilter('uncompleted')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                completionFilter === 'uncompleted'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              ค้างส่ง/ต้องตามงาน ({uncompletedTeachersCount})
            </button>
            <button
              onClick={() => setCompletionFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                completionFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              ส่งครบแล้ว ({completedTeachersCount})
            </button>
          </div>
        </div>

        {/* Search & Department Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อครู หรือกลุ่มสาระฯ..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 p-2 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกกลุ่มสาระการเรียนรู้ ({rows.length} ท่าน)</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Legend Guide */}
          <div className="flex items-center justify-end gap-2 text-[11px] text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" /> ผ่านเรียบร้อย
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <Clock className="w-3 h-3 text-blue-600" /> รอแอดมินตรวจ
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" /> ส่งแก้ไข
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <X className="w-3 h-3 text-rose-500" /> ยังไม่ส่ง
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: STANDARD HORIZONTAL TABLE (แนวนอน อ่านง่าย ชัดเจน) */}
      {/* ======================================================== */}
      {viewMode === 'standard' && (
        <div className="w-full max-w-full overflow-x-auto min-w-0 border-t border-slate-200 max-h-[750px] relative shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Table Header: Clear Horizontal Columns with Comfortable Width */}
            <thead className="bg-slate-50 text-slate-700 sticky top-0 z-30 shadow-xs">
              <tr>
                {/* Sticky Col 1: Index */}
                <th className="p-3 w-12 text-center font-bold border-r border-b border-slate-200 sticky left-0 z-40 bg-slate-100 align-middle">
                  #
                </th>

                {/* Sticky Col 2: Teacher Name & Dept */}
                <th className="p-3.5 w-60 min-w-[220px] max-w-[240px] font-bold border-r border-b border-slate-200 sticky left-12 z-40 bg-slate-100 align-middle shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  รายชื่อคุณครูผู้สอน
                </th>

                {/* DYNAMIC TOPIC COLUMNS: Normal Horizontal Text, Full Context, No Rotation */}
                {topics.map((topic, idx) => {
                  const stat = topicStats[topic.id] || { submittedCount: 0, passedCount: 0, completionRate: 0 };
                  const dueDt = new Date(topic.dueDate);
                  const isHovered = hoveredTopicId === topic.id;

                  return (
                    <th 
                      key={topic.id}
                      onMouseEnter={() => setHoveredTopicId(topic.id)}
                      onMouseLeave={() => setHoveredTopicId(null)}
                      className={`p-3.5 pt-4 w-60 min-w-[210px] max-w-[250px] border-r border-b border-slate-200 align-top transition-colors cursor-pointer bg-slate-50 ${
                        isHovered ? 'bg-blue-50/80 border-b-blue-400' : 'hover:bg-slate-100/70'
                      }`}
                      title={`คลิกเพื่อดูสรุปงาน: ${topic.title}`}
                    >
                      <div className="space-y-2.5">
                        {/* Topic Header Top: Badge & Category */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            งานที่ #{idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 truncate">
                            {topic.category}
                          </span>
                        </div>

                        {/* Topic Title (Horizontal, Readable Thai text!) */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[34px]" title={topic.title}>
                          {topic.title}
                        </h4>

                        {/* Due Date & Progress Mini Bar */}
                        <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {dueDt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="font-semibold text-blue-700">
                              ส่งแล้ว {stat.submittedCount}/{totalTeachers}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${stat.completionRate}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    </th>
                  );
                })}

                {/* Total Column */}
                <th className="p-3 w-28 min-w-[105px] font-bold text-center border-l border-b border-slate-200 bg-slate-100 align-middle">
                  ภาพรวม
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.map((row, rowIdx) => {
                const isCurrentUser = currentUser?.uid === row.teacher.uid;
                const stickyBg = isCurrentUser ? 'bg-blue-50' : 'bg-white';

                return (
                  <tr 
                    key={row.teacher.uid} 
                    className={`transition-colors ${
                      isCurrentUser 
                        ? 'bg-blue-50/30 hover:bg-blue-50/50' 
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    
                    {/* Sticky Col 1: Index */}
                    <td className={`p-3 text-center text-slate-400 font-semibold border-r border-slate-100 sticky left-0 z-20 ${stickyBg}`}>
                      {rowIdx + 1}
                    </td>

                    {/* Sticky Col 2: Teacher Profile */}
                    <td className={`p-3 border-r border-slate-200 sticky left-12 z-20 ${stickyBg} shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]`}>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={row.teacher.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt=""
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 truncate text-xs">
                              {row.teacher.displayName}
                            </p>
                            {isCurrentUser && (
                              <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-md flex-shrink-0 shadow-2xs">
                                คุณ
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {row.teacher.learningAreaName || 'ทั่วไป'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* DYNAMIC TOPIC CELLS: Clear, Readable Status Badges with Context */}
                    {topics.map(topic => {
                      const cell = row.cells[topic.id];
                      const isHovered = hoveredTopicId === topic.id;

                      return (
                        <td 
                          key={topic.id}
                          className={`p-2.5 border-r border-slate-100 align-middle transition-colors ${
                            isHovered ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          {cell && cell.hasSubmitted ? (
                            <div 
                              onClick={() => setSelectedCell({
                                teacherName: row.teacher.displayName,
                                topicTitle: topic.title,
                                category: topic.category,
                                cell
                              })}
                              className="cursor-pointer p-2 rounded-xl transition-all border border-transparent hover:border-slate-300 hover:shadow-xs hover:bg-white group"
                            >
                              {/* Status Badge with Text (ชัดเจน อ่านง่ายมาก) */}
                              {cell.status === 'passed' && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shadow-2xs">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  <span>ผ่านเรียบร้อย</span>
                                </div>
                              )}

                              {cell.status === 'submitted' && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span>รอแอดมินตรวจ</span>
                                </div>
                              )}

                              {cell.status === 'revision_required' && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold shadow-2xs">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                  <span>ต้องส่งแก้ไข</span>
                                </div>
                              )}

                              {/* Submitted Date & Late Warning */}
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                <span>
                                  {cell.submission?.submittedAt 
                                    ? new Date(cell.submission.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                                    : '-'}
                                </span>
                                {cell.isLate && (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                    ส่งช้า
                                  </span>
                                )}
                              </div>

                              {/* Sub-tasks Progress Indicator */}
                              {topic.subTasks && topic.subTasks.length > 0 && (() => {
                                const total = topic.subTasks.length;
                                const completed = cell.subTasksCount?.completed ?? 0;
                                const is100 = completed >= total && total > 0;
                                const rate = cell.subTasksCompletionRate ?? (total > 0 ? Math.round((completed / total) * 100) : 0);

                                return (
                                  <div className="mt-2 space-y-1">
                                    <div className={`flex items-center justify-between text-[10px] px-2 py-0.5 rounded-lg border font-bold ${
                                      is100
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}>
                                      <span className="flex items-center gap-1 truncate">
                                        <ListTodo className={`w-3 h-3 flex-shrink-0 ${is100 ? 'text-emerald-600' : 'text-amber-600'}`} />
                                        <span>{is100 ? 'ส่งไฟล์ย่อยครบ 100%' : `ไฟล์ย่อย ${completed}/${total}`}</span>
                                      </span>
                                      <span className="font-extrabold flex-shrink-0 ml-1">
                                        {rate}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                          is100 ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${rate}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="p-2">
                              {isCurrentUser ? (
                                <Link
                                  to={`/submit?topicId=${topic.id}`}
                                  className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all border border-blue-200 shadow-2xs group"
                                  title={`คลิกเพื่อส่งงาน: ${topic.title}`}
                                >
                                  <PlusCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                  <span>ส่งงานนี้</span>
                                </Link>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-200/80 text-[11px] font-medium">
                                  <X className="w-3 h-3 text-slate-400" />
                                  <span>ยังไม่ส่ง</span>
                                </div>
                              )}
                              {topic.subTasks && topic.subTasks.length > 0 && (
                                <p className="text-[9px] text-slate-400 mt-1 text-center font-medium">
                                  ({topic.subTasks.length} งานย่อย)
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* End Total Progress Column */}
                    <td className="p-3 text-center border-l border-slate-100 align-middle">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className="font-bold text-xs text-slate-800">
                          {row.submittedCount}/{row.totalTopics}
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              row.completionRate === 100 
                                ? 'bg-emerald-500' 
                                : row.completionRate > 0 
                                  ? 'bg-blue-600' 
                                  : 'bg-slate-300'
                            }`}
                            style={{ width: `${row.completionRate}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500">
                          {row.completionRate}%
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer Summary Row */}
            <tfoot className="bg-slate-100/90 font-semibold border-t-2 border-slate-300 text-xs">
              <tr>
                <td colSpan={2} className="p-3.5 pl-6 text-slate-700 sticky left-0 z-20 bg-slate-100 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  สรุปยอดส่งงานในแต่ละหัวข้อ:
                </td>

                {topics.map(topic => {
                  const stat = topicStats[topic.id] || { submittedCount: 0, passedCount: 0, completionRate: 0 };
                  return (
                    <td key={topic.id} className="p-3 text-center border-r border-slate-200">
                      <p className="font-bold text-blue-700 text-xs">{stat.submittedCount}/{totalTeachers} ท่าน</p>
                      <p className="text-[10px] text-slate-500">({stat.completionRate}%)</p>
                    </td>
                  );
                })}

                <td className="p-3 text-center border-l border-slate-200">
                  <span className="font-bold text-blue-900 text-xs">{overallPercentage}%</span>
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: TOPIC BREAKDOWN VIEW (ติดตามแยกรายหัวข้องาน)       */}
      {/* ======================================================== */}
      {viewMode === 'topics' && (
        <div className="p-6 space-y-6 border-t border-slate-200">
          
          {/* Topic Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              เลือกหัวข้องานที่ต้องการติดตามความคืบหน้า:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {topics.map((topic, idx) => {
                const stat = topicStats[topic.id] || { submittedCount: 0, passedCount: 0, completionRate: 0 };
                const isSelected = activeTopicTab === topic.id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopicTab(topic.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    <span>#{idx + 1} {topic.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {stat.submittedCount}/{totalTeachers}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Topic Detail Card */}
          {currentTopic && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {currentTopic.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {currentTopic.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentTopic.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">กำหนดส่งงาน:</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(currentTopic.dueDate).toLocaleDateString('th-TH', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
                    <span className="text-[10px] text-slate-400 block">ความคืบหน้า</span>
                    <span className="text-sm font-black text-blue-600">
                      {currentTopicStat?.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Split: Pending Teachers (ค้างส่ง) vs Submitted Teachers (ส่งแล้ว) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Column 1: PENDING / UNCOMPLETED TEACHERS (ยังค้างส่ง - ติดตามทวงงาน) */}
                <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                    <h5 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      คุณครูที่ยังไม่ส่งงาน ({totalTeachers - (currentTopicStat?.submittedCount || 0)} ท่าน)
                    </h5>
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      ต้องติดตาม
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {rows.filter(r => !r.cells[currentTopic.id]?.hasSubmitted).map(r => (
                      <div 
                        key={r.teacher.uid}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-rose-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={r.teacher.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {r.teacher.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {r.teacher.learningAreaName || 'ทั่วไป'}
                            </p>
                          </div>
                        </div>

                        {currentUser?.uid === r.teacher.uid ? (
                          <Link
                            to={`/submit?topicId=${currentTopic.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs"
                          >
                            <Send className="w-3 h-3" /> ส่งผลงาน
                          </Link>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-white px-2 py-1 rounded-md border border-rose-200">
                            ยังค้างส่ง
                          </span>
                        )}
                      </div>
                    ))}

                    {rows.filter(r => !r.cells[currentTopic.id]?.hasSubmitted).length === 0 && (
                      <div className="p-8 text-center text-slate-400 space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">คุณครูทุกคนส่งงานหัวข้อนี้ครบเรียบร้อยแล้ว!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: SUBMITTED TEACHERS (ส่งผลงานแล้ว) */}
                <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                    <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      คุณครูที่ส่งผลงานแล้ว ({currentTopicStat?.submittedCount || 0} ท่าน)
                    </h5>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ส่งแล้ว
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {rows.filter(r => r.cells[currentTopic.id]?.hasSubmitted).map(r => {
                      const cell = r.cells[currentTopic.id];
                      return (
                        <div 
                          key={r.teacher.uid}
                          onClick={() => setSelectedCell({
                            teacherName: r.teacher.displayName,
                            topicTitle: currentTopic.title,
                            category: currentTopic.category,
                            cell
                          })}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={r.teacher.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                                {r.teacher.displayName}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {cell.submission?.title || 'ส่งผลงานแล้ว'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {cell.subTasksCount && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                                cell.subTasksCount.completed >= cell.subTasksCount.total
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                <ListTodo className="w-3 h-3 flex-shrink-0" />
                                {cell.subTasksCount.completed >= cell.subTasksCount.total 
                                  ? 'ครบ 100%' 
                                  : `${cell.subTasksCount.completed}/${cell.subTasksCount.total}`}
                              </span>
                            )}
                            {cell.status === 'passed' && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                                ผ่านเรียบร้อย
                              </span>
                            )}
                            {cell.status === 'submitted' && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                                รอตรวจ
                              </span>
                            )}
                            {cell.status === 'revision_required' && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                                ส่งแก้ไข
                              </span>
                            )}
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                          </div>
                        </div>
                      );
                    })}

                    {rows.filter(r => r.cells[currentTopic.id]?.hasSubmitted).length === 0 && (
                      <div className="p-8 text-center text-slate-400 space-y-1">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-medium text-slate-500">ยังไม่มีผู้ส่งผลงานในหัวข้อนี้</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: COMPACT LEDGER (สมุดตรวจแบบกระชับ)                */}
      {/* ======================================================== */}
      {viewMode === 'compact' && (
        <div className="overflow-x-auto border-t border-slate-200 max-h-[700px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 sticky top-0 z-30 shadow-xs">
              <tr>
                <th className="p-2.5 w-10 text-center font-bold border-r border-b border-slate-200 sticky left-0 z-40 bg-slate-100">
                  #
                </th>
                <th className="p-2.5 w-52 min-w-[200px] font-bold border-r border-b border-slate-200 sticky left-10 z-40 bg-slate-100 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                  ชื่อครูผู้สอน
                </th>
                {topics.map((topic, idx) => (
                  <th 
                    key={topic.id}
                    className="p-2 w-28 min-w-[100px] border-r border-b border-slate-200 text-center align-bottom bg-slate-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="space-y-1 py-1">
                      <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        #{idx + 1}
                      </span>
                      <p className="font-bold text-slate-800 text-[11px] truncate max-w-[95px] mx-auto" title={topic.title}>
                        {topic.title}
                      </p>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 block truncate">
                        {topic.category}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-20 text-center font-bold border-l border-b border-slate-200 bg-slate-100">
                  รวม
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.map((row, rowIdx) => {
                const isCurrentUser = currentUser?.uid === row.teacher.uid;
                return (
                  <tr key={row.teacher.uid} className={`hover:bg-slate-50 ${isCurrentUser ? 'bg-blue-50/20' : ''}`}>
                    <td className="p-2 text-center text-slate-400 font-semibold border-r border-slate-100 sticky left-0 z-20 bg-inherit">
                      {rowIdx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-200 sticky left-10 z-20 bg-inherit shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-2">
                        <img
                          src={row.teacher.photo?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt=""
                          className="w-6 h-6 rounded-md object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-xs">
                            {row.teacher.displayName}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            {row.teacher.learningAreaName || 'ทั่วไป'}
                          </p>
                        </div>
                      </div>
                    </td>
                    {topics.map(topic => {
                      const cell = row.cells[topic.id];
                      return (
                        <td key={topic.id} className="p-1 border-r border-slate-100 text-center align-middle">
                          {cell && cell.hasSubmitted ? (
                            <button
                              onClick={() => setSelectedCell({
                                teacherName: row.teacher.displayName,
                                topicTitle: topic.title,
                                category: topic.category,
                                cell
                              })}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs shadow-2xs transition-transform hover:scale-110 ${
                                cell.status === 'passed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                cell.status === 'submitted' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                              title={`${cell.submission?.title} (คลิกดูรายละเอียด)`}
                            >
                              {cell.status === 'passed' ? '✓' : cell.status === 'submitted' ? '⏳' : '⚠️'}
                            </button>
                          ) : (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center text-rose-400 font-bold text-xs bg-rose-50/50 border border-rose-100">
                              ✗
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center border-l border-slate-100 align-middle">
                      <span className="font-bold text-xs text-slate-800">
                        {row.submittedCount}/{row.totalTopics}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer Notice */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          หัวตารางจะเพิ่มงานใหม่ขึ้นมาทางขวามืออัตโนมัติ เมื่อแอดมินสร้างหัวข้อเรื่องถัดไป
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Lock className="w-3 h-3 text-amber-500" /> สิทธิ์ไฟล์เอกสาร: เปิดดูและดาวน์โหลดได้เฉพาะแอดมินและครูเจ้าของผลงาน
        </span>
      </div>

      {/* QUICK VIEW POPUP MODAL FOR CLICKED CELL */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedCell.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedCell.topicTitle}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">คุณครูผู้ส่งผลงาน:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedCell.teacherName}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">ชื่องานที่ส่ง:</span>
                <span className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 block">
                  {selectedCell.cell.submission?.title}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">สถานะผลการตรวจ:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedCell.cell.status} isLate={selectedCell.cell.isLate} />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">วันที่ส่ง:</span>
                  <span className="font-medium text-slate-700">
                    {selectedCell.cell.submission?.submittedAt 
                      ? new Date(selectedCell.cell.submission.submittedAt).toLocaleDateString('th-TH')
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Sub-tasks breakdown in modal */}
              {(() => {
                const topicObj = topics.find(t => t.id === selectedCell.cell.topicId || t.title === selectedCell.topicTitle);
                if (!topicObj?.subTasks || topicObj.subTasks.length === 0) return null;

                const total = topicObj.subTasks.length;
                const subTaskFilesMap = selectedCell.cell.subTaskFilesMap || {};
                const completed = selectedCell.cell.subTasksCount?.completed ?? 0;
                const rate = selectedCell.cell.subTasksCompletionRate ?? (total > 0 ? Math.round((completed / total) * 100) : 0);
                const is100 = completed >= total && total > 0;

                return (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    is100 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-purple-50/50 border-purple-200'
                  }`}>
                    {/* Header with 100% Progress Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <ListTodo className={`w-4 h-4 ${is100 ? 'text-emerald-600' : 'text-purple-600'}`} />
                          <span className="text-xs font-bold text-slate-900">
                            รายการงานย่อยในหัวข้อนี้ ({total} รายการ)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          ตรวจเช็กสถานะการแนบไฟล์ของแต่ละงานย่อย
                        </p>
                      </div>

                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        is100 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs' 
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {is100 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>ส่งไฟล์ย่อยครบแล้ว 100%</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>ส่งแล้ว {completed}/{total} รายการ ({rate}%)</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Overall Progress Bar for Subtasks */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>ความคืบหน้าการส่งไฟล์ย่อย:</span>
                        <span className="font-bold text-slate-700">{completed}/{total} รายการ ({rate}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            is100 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed List of Each Sub-task and Its Files */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {topicObj.subTasks.map((st, i) => {
                        const attachedFiles = subTaskFilesMap[st.id] || [];
                        const isSubTaskDone = attachedFiles.length > 0 || (i < completed && attachedFiles.length === 0);

                        return (
                          <div 
                            key={st.id} 
                            className={`p-2.5 rounded-xl border text-xs transition-all ${
                              isSubTaskDone
                                ? 'bg-white border-emerald-200 shadow-2xs'
                                : 'bg-white/80 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-semibold text-slate-800 text-xs truncate">
                                  {i + 1}. {st.title}
                                </span>
                                {st.isRequired && (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex-shrink-0">
                                    จำเป็น
                                  </span>
                                )}
                              </div>

                              {isSubTaskDone ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex-shrink-0">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>ส่งแล้ว</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                                  <X className="w-3 h-3 text-slate-400" />
                                  <span>ยังไม่ส่ง</span>
                                </span>
                              )}
                            </div>

                            {/* Show attached files for this subtask if any */}
                            {attachedFiles.length > 0 ? (
                              <div className="mt-2 pt-2 border-t border-emerald-100 flex flex-wrap gap-1.5">
                                {attachedFiles.map(af => {
                                  const canOpen = role === 'admin' || currentUser?.uid === selectedCell.cell.submission?.teacherUid;
                                  
                                  return canOpen ? (
                                    <button
                                      key={af.id}
                                      type="button"
                                      onClick={() => setViewerFile({
                                        ...af,
                                        subTaskTitle: st.title,
                                        subTaskId: st.id
                                      })}
                                      className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 hover:bg-blue-600 text-emerald-900 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer group shadow-2xs"
                                      title="คลิกเพื่อเปิดดูไฟล์นี้ทันทีโดยไม่ต้องดาวน์โหลด"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                                      <span className="truncate max-w-[190px] font-medium" title={af.fileName}>{af.fileName}</span>
                                      <span className="text-[9px] text-emerald-700/80 group-hover:text-white/80">
                                        ({(af.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)
                                      </span>
                                    </button>
                                  ) : (
                                    <div 
                                      key={af.id}
                                      className="inline-flex items-center gap-1.5 text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200 max-w-full"
                                      title="ไฟล์สงวนสิทธิ์เฉพาะแอดมินและครูผู้ส่ง"
                                    >
                                      <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                      <span className="truncate max-w-[190px]">{af.fileName}</span>
                                      <span className="text-[9px] text-slate-400">
                                        ({(af.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : isSubTaskDone ? (
                              <div className="mt-1 text-[10px] text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> แนบไฟล์พร้อมส่งเรียบร้อยแล้ว
                              </div>
                            ) : (
                              <div className="mt-1 text-[10px] text-slate-400">
                                ⏳ ยังไม่มีไฟล์แนบสำหรับงานย่อยนี้
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Privacy alert for other teachers */}
              {role !== 'admin' && currentUser?.uid !== selectedCell.cell.submission?.teacherUid && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ไฟล์เอกสารสงวนสิทธิ์เฉพาะผู้ส่งและแอดมิน</span>
                    <span className="text-[10px] text-amber-700">ระบบจำกัดให้ดูได้เฉพาะสถานะการส่งงาน ไฟล์ผลงานจริงเปิดดูได้เฉพาะแอดมินและครูเจ้าของผลงานเท่านั้น</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>
              
              {selectedCell.cell.submission && (role === 'admin' || currentUser?.uid === selectedCell.cell.submission.teacherUid) && (
                <Link
                  to={`/submissions/${selectedCell.cell.submission.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {role === 'admin' ? 'เปิดตรวจผลงานและดูไฟล์' : 'ดูรายละเอียดผลงานของฉัน'}
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Document Viewer Modal for Direct File Inspection */}
      <DocumentViewerModal
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
        teacherName={selectedCell?.teacherName}
        topicTitle={selectedCell?.topicTitle}
        canReview={false}
      />

    </div>
  );
};
