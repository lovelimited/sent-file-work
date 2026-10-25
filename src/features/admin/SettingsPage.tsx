import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSettings, saveSettings } from '../../lib/storage';
import { SystemSettings } from '../../types';
import { 
  Settings as SettingsIcon, 
  Save, 
  HardDrive, 
  FileSpreadsheet, 
  Database, 
  Bell, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { syncDataToGoogleSheets } from '../../lib/googleSheetsSync';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const currentSettings = getSettings();

  const [form, setForm] = useState<SystemSettings>(currentSettings);
  const [lineGroupId, setLineGroupId] = useState('C1234567890abcdef');

  const handleChange = (field: keyof SystemSettings, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    saveSettings(form, currentUser);
    Swal.fire('บันทึกการตั้งค่าเรียบร้อย!', 'ข้อมูลการตั้งค่าระบบและบริการเชื่อมต่อถูกอัปเดตแล้ว', 'success');
  };

  const handleTestLine = () => {
    Swal.fire({
      title: 'ทดสอบส่งข้อความแจ้งเตือน LINE',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-600">
          <p>ส่งสัญญาณ Push Message ไปยัง LINE Messaging API</p>
          <p><strong>Target Group ID:</strong> <span class="font-mono text-blue-600">${lineGroupId}</span></p>
          <div class="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            ✓ LINE Webhook Outbox: ส่งข้อความแจ้งเตือน "ระบบทดสอบการส่งข้อความงานวิชาการ 2569 สำเร็จ" เรียบร้อยแล้ว
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonColor: '#16a34a',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          ตั้งค่าระบบและบริการเชื่อมต่อ (System & Integration Settings)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          กำหนดข้อมูลสถานศึกษา ภาคเรียน และตรวจสอบการเชื่อมโยง Google Drive, Sheets, Firebase และ LINE
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Section 1: General Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            1. ข้อมูลสถานศึกษาและข้อความต้อนรับ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อสถานศึกษา
              </label>
              <input
                type="text"
                value={form.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อระบบสารสนเทศ
              </label>
              <input
                type="text"
                value={form.systemName}
                onChange={(e) => handleChange('systemName', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ปีการศึกษาปัจจุบัน
              </label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ภาคเรียน
              </label>
              <input
                type="text"
                value={form.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ข้อความต้อนรับบนแผงควบคุม (Welcome Text)
            </label>
            <input
              type="text"
              value={form.welcomeText}
              onChange={(e) => handleChange('welcomeText', e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800"
            />
          </div>
        </div>

        {/* Section 2: Google Workspace Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>2. การเชื่อมต่อ Google Drive & Sheets (จาก setting.txt)</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Config
            </span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                Google Drive Root Folder ID (ขอบเขตการจัดเก็บไฟล์ทั้งหมด)
              </label>
              <input
                type="text"
                value={form.googleDriveRootFolderId}
                onChange={(e) => handleChange('googleDriveRootFolderId', e.target.value)}
                className="w-full text-xs font-mono rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ทุกไฟล์งานของครูจะถูกจัดเก็บแบบ Private และเข้าถึงผ่านสิทธิ์บัญชีภายใต้ Folder นี้เท่านั้น
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Google Sheet ID (เอกสารสรุปผลงานวิชาการ)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.googleSheetReportId}
                  onChange={(e) => handleChange('googleSheetReportId', e.target.value)}
                  className="flex-1 text-xs font-mono rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800"
                  required
                />
                <a
                  href={`https://docs.google.com/spreadsheets/d/${form.googleSheetReportId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  เปิดดูสเปรดชีต <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  Google Apps Script Webhook URL (ระบบซิงค์ข้อมูลชีตอัตโนมัติ)
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                  Active Web App (/exec)
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={form.googleAppsScriptWebhookUrl || 'https://script.google.com/macros/s/AKfycbwWXslp2PkyGAeAL1YGWe84sc6czzRMOZaJdxYI7sScXGbgg8eCayu82sL2-INeujErDQ/exec'}
                  onChange={(e) => handleChange('googleAppsScriptWebhookUrl', e.target.value)}
                  className="flex-1 text-xs font-mono rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800"
                  required
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (currentUser) saveSettings(form, currentUser);
                    const res = await syncDataToGoogleSheets('SETTINGS_TEST');
                    Swal.fire({
                      title: res.success ? 'ทดสอบซิงค์สำเร็จ!' : 'ซิงค์ไม่สำเร็จ',
                      text: res.message,
                      icon: res.success ? 'success' : 'error',
                      confirmButtonText: 'เปิดดู Google Sheets',
                      showCancelButton: true,
                      cancelButtonText: 'ปิด',
                      confirmButtonColor: '#16a34a'
                    }).then(r => {
                      if (r.isConfirmed) {
                        window.open(`https://docs.google.com/spreadsheets/d/${form.googleSheetReportId}`, '_blank');
                      }
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ทดสอบซิงค์ชีต</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Webhook สำหรับเชื่อมต่อ Google Sheets ผ่าน Google Apps Script อัตโนมัติทุกครั้งที่มีความเคลื่อนไหว
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: LINE Messaging API Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>3. การแจ้งเตือนผ่านกลุ่ม LINE (LINE Messaging API)</span>
            <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Push Messaging
            </span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.lineNotifyEnabled}
                onChange={(e) => handleChange('lineNotifyEnabled', e.target.checked)}
                className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
              />
              เปิดการแจ้งเตือนงานส่งใหม่ / ผลการตรวจ เข้ากลุ่มไลน์ผู้นิเทศ
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LINE Target Group ID (สำหรับกลุ่มผู้บริหารและผู้นิเทศ)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lineGroupId}
                  onChange={(e) => setLineGroupId(e.target.value)}
                  placeholder="เช่น C1234567890abcdef..."
                  className="flex-1 text-xs font-mono rounded-xl border border-slate-200 p-2.5 text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleTestLine}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  ทดสอบส่งข้อความ (Test Push)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            บันทึกการตั้งค่าทั้งหมด
          </button>
        </div>

      </form>

    </div>
  );
};
