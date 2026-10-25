import { getSettings } from './storage';
import { GAS_WEBHOOK_URL } from './googleSheetsSync';

export interface UploadFileItem {
  fileObject?: File;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  subTaskId?: string;
  subTaskTitle?: string;
  base64?: string;
}

export interface DriveUploadResult {
  success: boolean;
  message: string;
  files: Array<{
    fileName: string;
    fileId?: string;
    fileUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
    subTaskId?: string;
  }>;
  folderName?: string;
  folderUrl?: string;
  needsAuthorization?: boolean;
}

/**
 * Helper to convert browser File object to Base64 string
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data url prefix (e.g. data:application/pdf;base64,)
      const base64 = result.indexOf(',') > -1 ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload multiple files to Google Drive via Google Apps Script Webhook
 */
export async function uploadFilesToGoogleDrive(params: {
  topicTitle: string;
  teacherName: string;
  files: UploadFileItem[];
}): Promise<DriveUploadResult> {
  const settings = getSettings();
  const webhookUrl = settings.googleAppsScriptWebhookUrl || GAS_WEBHOOK_URL;
  const folderId = settings.googleDriveRootFolderId || '1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd';

  if (!webhookUrl || !webhookUrl.includes('/exec')) {
    return {
      success: false,
      message: 'ไม่พบ URL ของ Google Apps Script Webhook ในการตั้งค่า',
      files: []
    };
  }

  try {
    // Convert files to base64 payload
    const preparedFiles = await Promise.all(
      params.files.map(async f => {
        let b64 = f.base64 || '';
        if (!b64 && f.fileObject) {
          b64 = await readFileAsBase64(f.fileObject);
        }
        return {
          fileName: f.fileName,
          mimeType: f.mimeType || 'application/octet-stream',
          subTaskId: f.subTaskId,
          base64: b64
        };
      })
    );

    const payload = {
      action: 'UPLOAD_FILES',
      folderId,
      topicTitle: params.topicTitle,
      teacherName: params.teacherName,
      createTeacherFolder: false, // Keep clean topic folders
      files: preparedFiles
    };

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      throw new Error(`HTTP Error: ${resp.status}`);
    }

    const data = await resp.json();

    if (data.status === 'error') {
      const isAuthError = data.message && data.message.includes('DriveApp');
      return {
        success: false,
        message: data.message,
        needsAuthorization: isAuthError,
        files: params.files.map(f => ({
          fileName: f.fileName,
          subTaskId: f.subTaskId
        }))
      };
    }

    return {
      success: true,
      message: data.message || 'บันทึกไฟล์ลง Google Drive สำเร็จ',
      folderName: data.folderName,
      folderUrl: data.folderUrl,
      files: (data.files || []).map((f: any) => ({
        fileName: f.originalName || f.savedName,
        fileId: f.fileId,
        fileUrl: f.fileUrl,
        previewUrl: f.previewUrl,
        downloadUrl: f.downloadUrl,
        subTaskId: f.subTaskId
      }))
    };
  } catch (err: any) {
    console.error('Google Drive upload error:', err);
    return {
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Drive',
      files: params.files.map(f => ({
        fileName: f.fileName,
        subTaskId: f.subTaskId
      }))
    };
  }
}

/**
 * Initialize topic folders inside Google Drive root
 */
export async function initTopicFoldersInGoogleDrive(topics: Array<{ title: string }>): Promise<{
  success: boolean;
  message: string;
  topicFolders?: Array<{ title: string; folderId: string; folderUrl: string }>;
  needsAuthorization?: boolean;
}> {
  const settings = getSettings();
  const webhookUrl = settings.googleAppsScriptWebhookUrl || GAS_WEBHOOK_URL;
  const folderId = settings.googleDriveRootFolderId || '1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd';

  try {
    const payload = {
      action: 'INIT_DRIVE_FOLDERS',
      folderId,
      topics
    };

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (data.status === 'error') {
      const isAuthError = data.message && data.message.includes('DriveApp');
      return {
        success: false,
        message: data.message,
        needsAuthorization: isAuthError
      };
    }

    return {
      success: true,
      message: data.message,
      topicFolders: data.topicFolders
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive'
    };
  }
}
