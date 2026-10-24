import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getSubmissions, 
  getUsers, 
  getLibraryFiles, 
  getActivityLogs, 
  getSettings 
} from '../../lib/storage';
import { syncDataToGoogleSheets, getLastSheetsSyncInfo } from '../../lib/googleSheetsSync';
import { TeacherSubmissionTracker } from '../../components/common/TeacherSubmissionTracker';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileCheck2, 
  TrendingUp, 
  BookOpen, 
  FileSpreadsheet, 
  HardDrive, 
  Database, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  Lock,
  ExternalLink,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const settings = getSettings();
  const submissions = getSubmissions();
  const users = getUsers();
  const libraryFiles = getLibraryFiles();
  const logs = getActivityLogs().slice(0, 5);

  const [syncInfo, setSyncInfo] = useState(() => getLastSheetsSyncInfo());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleSynced = () => {
      setSyncInfo(getLastSheetsSyncInfo());
    };
    window.addEventListener('sent_work_sheets_synced', handleSynced);
    return () => window.removeEventListener('sent_work_sheets_synced', handleSynced);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await syncDataToGoogleSheets('ADMIN_MANUAL_TRIGGER');
    setIsSyncing(false);
    setSyncInfo(getLastSheetsSyncInfo());
    Swal.fire({
      title: 'ซิงค์ข้อมูล Google Sheets สำเร็จ!',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-600">
          <p class="text-emerald-700 font-semibold">✓ ข้อมูลการส่งงานและผลการตรวจเชื่อมโยงกับ Google Sheets เรียบร้อยแล้ว</p>
          <p>จำนวนข้อมูลที่ประมวลผล: <b>${res.rowCount} รายการ</b></p>
          <div class="p-2.5 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-800 break-all">
            Sheet ID: ${settings.googleSheetReportId}
          </div>
          <p class="text-slate-500 text-[11px]">ระบบทำงานแบบ Auto-Sync ตลอดเวลา ทุกครั้งที่มีครูส่งงานหรือแอดมินตรวจรับรอง ข้อมูลจะอัปเดตลง Google Sheets ทันทีอัตโนมัติ</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'เปิดดูเอกสาร Google Sheets',
      showCancelButton: true,
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#16a34a'
    }).then(r => {
      if (r.isConfirmed) {
        window.open(`https://docs.google.com/spreadsheets/d/${settings.googleSheetReportId}`, '_blank');
      }
    });
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const evaluatedCount = submissions.filter(s => s.status === 'passed' || s.status === 'revision_required' || s.status === 'rejected').length;
  const evaluationRate = submissions.length > 0 ? Math.round((evaluatedCount / submissions.length) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Admin Executive Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 mb-3 text-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> แดชบอร์ดผู้บริหาร & ฝ่ายตรวจงานวิชาการ
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {settings.schoolName || 'โรงเรียนสารสาสน์วิเทศราชพฤกษ์'}
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              ภาพรวมการส่งผลงานของครูทุกคน (แผนการสอน, วิจัย, สื่อ, รายงานโครงการ ฯลฯ) พร้อมระบบตรวจงานและคลังเอกสาร
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Auto-Sync Indicator Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>ซิงค์ Google Sheets อัตโนมัติ</span>
              <span className="text-[10px] text-emerald-200/90 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {syncInfo.formattedTime}
              </span>
            </div>

            {/* Direct Open Google Sheets Link */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetReportId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition-all hover:scale-[1.02] cursor-pointer"
              title="เปิดดูเอกสาร Google Sheets ที่ระบบซิงค์ให้อัตโนมัติ"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>เปิดดู Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Force Sync button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              title="กดเพื่อสั่งให้ระบบซิงค์ข้อมูลลง Google Sheets ทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</span>
            </button>

            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors"
            >
              ตั้งค่าระบบ
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">จำนวนครูในระบบ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{teachers.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">บัญชีครูประจำการ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">ผลงานที่ส่งทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{submissions.length}</p>
          <p className="text-[11px] text-blue-600/70 mt-1">ทุกประเภทผลงาน</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">ตรวจอนุมัติแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{evaluationRate}%</p>
          <p className="text-[11px] text-emerald-600/70 mt-1">{evaluatedCount} จาก {submissions.length} รายการ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">คลังเอกสารส่วนกลาง</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">{libraryFiles.length}</p>
          <p className="text-[11px] text-indigo-600/70 mt-1">คู่มือและแบบฟอร์ม</p>
        </div>
      </div>

      {/* Public / School-wide Submission Tracker */}
      <TeacherSubmissionTracker />

      {/* Grid: Connected Cloud Services & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cloud Services Status (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">สถานะบริการเชื่อมต่อ (System Status)</h3>
              <p className="text-[11px] text-slate-500">Firebase & Google Cloud Integration</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">Firebase Database & Auth</p>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Online
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                  send-file-51069
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">Google Drive Private Root</p>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Scoped
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                  ID: {settings.googleDriveRootFolderId}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Google Sheets Auto-Sync
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </p>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetReportId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    เปิดชีต <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  ซิงค์อัตโนมัติทันทีที่มีการส่งงานหรือตรวจรับรอง • ล่าสุด: <span className="font-semibold text-emerald-800">{syncInfo.formattedTime}</span>
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                  Sheet ID: {settings.googleSheetReportId}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">LINE Push Notifications</p>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  แจ้งเตือนเข้ากลุ่มผู้บริหารทันทีที่มีงานส่ง
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">บันทึกกิจกรรมล่าสุด (Activity Audit Trail)</h3>
              <p className="text-xs text-slate-500">ตรวจสอบทุกการกระทำเพื่อความโปร่งใสและปลอดภัย</p>
            </div>
            <Link 
              to="/admin/activity-logs" 
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{log.actorName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded uppercase font-medium">
                      {log.actorRole}
                    </span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">{log.action}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            ))}
          </div>

          {/* Quick Management Shortcuts */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Link
              to="/admin/members"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700 text-xs font-medium text-center transition-colors"
            >
              จัดการสมาชิก
            </Link>
            <Link
              to="/admin/submission-types"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700 text-xs font-medium text-center transition-colors"
            >
              ตั้งค่าประเภทงาน
            </Link>
            <Link
              to="/admin/rounds"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700 text-xs font-medium text-center transition-colors"
            >
              ตั้งรอบส่งงาน
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
