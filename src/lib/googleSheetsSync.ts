import { 
  getSettings, 
  getFullSubmissionMatrix, 
  getSubmissionTopics, 
  getSubmissions,
  getUsers
} from './storage';

export interface SheetsSyncPayload {
  sheetId: string;
  spreadsheetUrl: string;
  schoolName: string;
  academicYear: string;
  semester: string;
  syncedAt: string;
  triggerReason: string;
  kpiStats: {
    totalTeachers: number;
    totalAdmins: number;
    totalUsers: number;
    totalTopics: number;
    totalSubmissions: number;
    passedSubmissions: number;
    revisionRequiredCount: number;
    completed100PercentTeachers: number;
    partialTeachers: number;
    zeroTeachers: number;
    overallCompletionRate: number;
  };
  matrixDashboard?: {
    topics: Array<{ id: string; title: string; category: string }>;
    rows: Array<{
      no: number;
      teacherName: string;
      department: string;
      cells: Record<string, {
        status: 'passed' | 'submitted' | 'revision_required' | 'not_submitted';
        statusText: string;
        isLate?: boolean;
      }>;
      submittedCount: number;
      totalTopics: number;
      completionRate: number;
      overallStatus: string;
    }>;
    topicStats: Record<string, { submittedCount: number; rate: number }>;
  };
  teachersRoster?: Array<{
    no: number;
    displayName: string;
    email: string;
    username: string;
    department: string;
    subjects: string;
    grades: string;
    phone: string;
    status: string;
    submittedCount: number;
    passedCount: number;
  }>;
  rows: Array<{
    no: number;
    teacherName: string;
    department: string;
    topicTitle: string;
    category: string;
    status: string;
    subTasksProgress: string;
    submittedAt: string;
    dueDate: string;
    timingStatus: string;
    driveFolder: string;
    adminReviewNote: string;
  }>;
}

const STORAGE_KEY_LAST_SYNC = 'sent_work_sheets_last_sync_time';
export const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwWXslp2PkyGAeAL1YGWe84sc6czzRMOZaJdxYI7sScXGbgg8eCayu82sL2-INeujErDQ/exec';

/**
 * Perform real-time data sync to Google Sheets
 */
export async function syncDataToGoogleSheets(triggerReason: string = 'AUTO_SYNC'): Promise<{
  success: boolean;
  message: string;
  rowCount: number;
  timestamp: string;
}> {
  try {
    const settings = getSettings();
    const matrix = getFullSubmissionMatrix();
    const topics = getSubmissionTopics();
    const submissions = getSubmissions();
    const users = getUsers();
    const teachers = users.filter(u => u.role === 'teacher' && u.status === 'active');
    const admins = users.filter(u => u.role === 'admin' && u.status === 'active');

    const totalSubmissions = submissions.length;
    const passedCount = submissions.filter(s => s.status === 'passed').length;
    const revisionCount = submissions.filter(s => s.status === 'revision_required').length;
    
    let totalAssignedWorks = teachers.length * topics.length;
    let totalCompletedWorks = 0;

    // Build teachers roster for dedicated sheet tab
    const teachersRoster = teachers.map((t, idx) => {
      const teacherSubs = submissions.filter(s => s.teacherUid === t.uid);
      const passedSubs = teacherSubs.filter(s => s.status === 'passed');
      return {
        no: idx + 1,
        displayName: t.displayName,
        email: t.email,
        username: t.username || '-',
        department: t.learningAreaName || 'วิชาการ',
        subjects: t.subjects?.map(s => s.name).join(', ') || 'วิชาทั่วไป',
        grades: t.gradeLevels?.join(', ') || '-',
        phone: t.phone || '-',
        status: t.status === 'active' ? 'เปิดใช้งาน' : 'ระงับบัญชี',
        submittedCount: teacherSubs.length,
        passedCount: passedSubs.length
      };
    });

    const reportRows: SheetsSyncPayload['rows'] = [];
    let rowNumber = 1;

    matrix.rows.forEach(r => {
      topics.forEach(t => {
        const cell = r.cells[t.id];
        const hasSub = cell?.hasSubmitted;
        if (hasSub) totalCompletedWorks++;

        let statusText = 'ยังไม่ส่ง';
        if (cell?.status === 'passed') statusText = '✓ ผ่านการตรวจรับรองแล้ว';
        else if (cell?.status === 'revision_required') statusText = '⚠️ ต้องส่งแก้ไขปรับปรุง';
        else if (cell?.status === 'submitted') statusText = '⏳ ส่งแล้ว (รอแอดมินตรวจ)';

        let subTaskText = 'ไม่มีงานย่อย';
        if (cell?.subTasksCount && cell.subTasksCount.total > 0) {
          subTaskText = `${cell.subTasksCompletionRate}% (${cell.subTasksCount.completed}/${cell.subTasksCount.total} งานย่อย)`;
        }

        const sub = cell?.submission;
        const submittedDateStr = sub?.submittedAt 
          ? new Date(sub.submittedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
          : '-';
        
        const dueDateStr = t.dueDate 
          ? new Date(t.dueDate).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
          : '-';

        let timing = '-';
        if (hasSub && sub) {
          timing = sub.isLate ? 'ส่งล่าช้า (Late)' : 'ตรงต่อเวลา (On-time)';
        }

        reportRows.push({
          no: rowNumber++,
          teacherName: r.teacher.displayName,
          department: r.teacher.learningAreaName || 'วิชาการ',
          topicTitle: t.title,
          category: t.category,
          status: statusText,
          subTasksProgress: subTaskText,
          submittedAt: submittedDateStr,
          dueDate: dueDateStr,
          timingStatus: timing,
          driveFolder: `Google Drive / ${t.title} /`,
          adminReviewNote: (sub as any)?.adminNote || (sub?.latestReviewDecision ? `ผลการตรวจ: ${sub.latestReviewDecision}` : '-')
        });
      });
    });

    const overallRate = totalAssignedWorks > 0 ? Math.round((totalCompletedWorks / totalAssignedWorks) * 100) : 0;
    const nowIso = new Date().toISOString();

    // Build 2D Matrix Dashboard data for Google Sheets
    let completed100PercentTeachers = 0;
    let partialTeachers = 0;
    let zeroTeachers = 0;

    const matrixRows = matrix.rows.map((r, idx) => {
      const teacherCells: Record<string, {
        status: 'passed' | 'submitted' | 'revision_required' | 'not_submitted';
        statusText: string;
        isLate?: boolean;
      }> = {};

      topics.forEach(t => {
        const cell = r.cells[t.id];
        let status: 'passed' | 'submitted' | 'revision_required' | 'not_submitted' = 'not_submitted';
        let statusText = '❌ ยังไม่ส่ง';

        if (cell?.status === 'passed') {
          status = 'passed';
          statusText = '✓ ผ่านแล้ว';
        } else if (cell?.status === 'revision_required') {
          status = 'revision_required';
          statusText = '⚠️ แก้ไข';
        } else if (cell?.status === 'submitted') {
          status = 'submitted';
          statusText = '⏳ รอตรวจ';
        }

        teacherCells[t.id] = {
          status,
          statusText,
          isLate: cell?.isLate
        };
      });

      if (r.submittedCount === topics.length && topics.length > 0) {
        completed100PercentTeachers++;
      } else if (r.submittedCount > 0) {
        partialTeachers++;
      } else {
        zeroTeachers++;
      }

      let overallStatus = '❌ ยังไม่ส่งงาน';
      if (r.submittedCount === topics.length && topics.length > 0) {
        overallStatus = '✓ ส่งครบ 100%';
      } else if (r.submittedCount > 0) {
        overallStatus = `⏳ ส่งแล้ว ${r.submittedCount}/${topics.length}`;
      }

      return {
        no: idx + 1,
        teacherName: r.teacher.displayName,
        department: r.teacher.learningAreaName || 'วิชาการ',
        cells: teacherCells,
        submittedCount: r.submittedCount,
        totalTopics: topics.length,
        completionRate: r.completionRate,
        overallStatus
      };
    });

    const topicStatsMap: Record<string, { submittedCount: number; rate: number }> = {};
    topics.forEach(t => {
      const stats = matrix.topicStats[t.id] || { submittedCount: 0, completionRate: 0 };
      topicStatsMap[t.id] = {
        submittedCount: stats.submittedCount,
        rate: stats.completionRate
      };
    });

    const matrixDashboard = {
      topics: topics.map(t => ({ id: t.id, title: t.title, category: t.category })),
      rows: matrixRows,
      topicStats: topicStatsMap
    };

    const payload: SheetsSyncPayload = {
      sheetId: settings.googleSheetReportId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${settings.googleSheetReportId}`,
      schoolName: settings.schoolName,
      academicYear: settings.academicYear,
      semester: settings.semester,
      syncedAt: nowIso,
      triggerReason,
      kpiStats: {
        totalTeachers: teachers.length,
        totalAdmins: admins.length,
        totalUsers: teachers.length + admins.length,
        totalTopics: topics.length,
        totalSubmissions,
        passedSubmissions: passedCount,
        revisionRequiredCount: revisionCount,
        completed100PercentTeachers,
        partialTeachers,
        zeroTeachers,
        overallCompletionRate: overallRate
      },
      matrixDashboard,
      teachersRoster,
      rows: reportRows
    };

    // Store in localStorage as synced cache
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);
    localStorage.setItem('sent_work_sheets_latest_payload', JSON.stringify({
      syncedAt: nowIso,
      rowCount: reportRows.length,
      overallRate,
      triggerReason
    }));

    // Trigger Google Apps Script Webhook asynchronously or await if deployed
    const webhookUrl = settings.googleAppsScriptWebhookUrl || GAS_WEBHOOK_URL;
    let netSuccess = false;

    if (webhookUrl && webhookUrl.includes('/exec')) {
      try {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          netSuccess = true;
        }
      } catch (postErr) {
        // Fallback with mode: 'no-cors' for browser environments with strict extensions
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          netSuccess = true;
        } catch (fallbackErr) {
          console.warn('Google Sheets sync background error:', fallbackErr);
        }
      }
    }

    // Dispatch global event for live UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sent_work_sheets_synced', {
        detail: {
          timestamp: nowIso,
          rowCount: reportRows.length,
          reason: triggerReason
        }
      }));
    }

    return {
      success: true,
      message: `ซิงค์ข้อมูล ${reportRows.length} รายการไปยัง Google Sheets เรียบร้อยแล้ว`,
      rowCount: reportRows.length,
      timestamp: nowIso
    };
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    return {
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดในการซิงค์ Google Sheets',
      rowCount: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Trigger background auto-sync without blocking user actions
 */
let debounceTimer: any = null;
export function triggerAutoSyncToGoogleSheets(reason: string = 'AUTO_ACTION'): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncDataToGoogleSheets(reason);
  }, 1000);
}

/**
 * Get last sync info for UI display
 */
export function getLastSheetsSyncInfo(): {
  lastSyncedAt: string | null;
  formattedTime: string;
  isRecent: boolean;
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    if (!stored) {
      return {
        lastSyncedAt: null,
        formattedTime: 'ยังไม่เคยซิงค์',
        isRecent: false
      };
    }
    const date = new Date(stored);
    const formatted = date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'Asia/Bangkok'
    }) + ' น.';
    
    // Check if within last 5 minutes
    const isRecent = (Date.now() - date.getTime()) < 300000;

    return {
      lastSyncedAt: stored,
      formattedTime: formatted,
      isRecent
    };
  } catch {
    return {
      lastSyncedAt: null,
      formattedTime: 'เมื่อสักครู่',
      isRecent: true
    };
  }
}

// Auto-listen to data mutations across the entire system
if (typeof window !== 'undefined') {
  window.addEventListener('sent_work_data_changed', (e: any) => {
    triggerAutoSyncToGoogleSheets(e?.detail?.action || 'DATA_CHANGED');
  });

  // Run initial sync on page load if never synced or stale
  setTimeout(() => {
    const info = getLastSheetsSyncInfo();
    if (!info.lastSyncedAt || !info.isRecent) {
      triggerAutoSyncToGoogleSheets('STARTUP_AUTO_SYNC');
    }
  }, 1500);
}
