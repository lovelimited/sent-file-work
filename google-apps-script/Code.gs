/**
 * ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารวิชาการ
 * โรงเรียนสารสาสน์วิเทศราชพฤกษ์
 * Google Apps Script Webhook สำหรับซิงค์ข้อมูลลง Google Sheets อัตโนมัติ
 * พัฒนาระบบโดย: ม.กฤตพจน์ แก้วกา
 */

const TARGET_SHEET_ID = "1N5t1SP33BkvUrc00lrjEvnRbfi1cf1JuesNJezVyZqU";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "ระบบ Google Sheets Sync พร้อมรับข้อมูลแบบเรียลไทม์",
    spreadsheetUrl: "https://docs.google.com/spreadsheets/d/" + TARGET_SHEET_ID,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No post data received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const sheetId = data.sheetId || TARGET_SHEET_ID;
    const ss = SpreadsheetApp.openById(sheetId);

    // ==========================================
    // 1. สร้าง/อัปเดตแท็บ "รายการส่งงาน" (Detail)
    // ==========================================
    let detailSheet = ss.getSheetByName("รายการส่งงาน");
    if (!detailSheet) {
      detailSheet = ss.insertSheet("รายการส่งงาน", 0);
    }

    detailSheet.clear();

    // หัวรายงาน
    detailSheet.getRange("A1").setValue(data.schoolName || "โรงเรียนสารสาสน์วิเทศราชพฤกษ์");
    detailSheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#1e3a8a");

    detailSheet.getRange("A2").setValue(
      "รายงานติดตามการส่งงานครูและผลการตรวจประเมินวิชาการ (ปีการศึกษา " + (data.academicYear || "2569") + " / " + (data.semester || "1") + ")"
    );
    detailSheet.getRange("A2").setFontSize(11).setFontWeight("bold").setFontColor("#475569");

    detailSheet.getRange("A3").setValue(
      "อัปเดตล่าสุด: " + new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) + 
      " น. | สาเหตุการซิงค์: " + (data.triggerReason || "AUTO_SYNC") + 
      " | ออกแบบและพัฒนาระบบโดย: ม.กฤตพจน์ แก้วกา"
    );
    detailSheet.getRange("A3").setFontSize(9).setFontColor("#64748b");

    // หัวตาราง
    const headers = [
      "ลำดับ",
      "ชื่อ-นามสกุลครูผู้สอน",
      "กลุ่มสาระการเรียนรู้",
      "รายการงาน / แผนการสอน",
      "หมวดหมู่งาน",
      "สถานะการตรวจประเมิน",
      "ความคืบหน้างานย่อย",
      "วัน-เวลาที่ส่ง",
      "กำหนดส่ง",
      "การตรงต่อเวลา",
      "โฟลเดอร์ Google Drive",
      "บันทึกผลการตรวจ / ข้อเสนอแนะ"
    ];

    const headerRange = detailSheet.getRange(5, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground("#1e40af");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");

    // แถวข้อมูล
    const rows = data.rows || [];
    if (rows.length > 0) {
      const rowValues = rows.map(r => [
        r.no,
        r.teacherName,
        r.department,
        r.topicTitle,
        r.category,
        r.status,
        r.subTasksProgress,
        r.submittedAt,
        r.dueDate,
        r.timingStatus,
        r.driveFolder,
        r.adminReviewNote
      ]);

      const dataRange = detailSheet.getRange(6, 1, rowValues.length, headers.length);
      dataRange.setValues(rowValues);
      dataRange.setFontSize(10);
      dataRange.setVerticalAlignment("middle");

      // ใส่เส้นขอบตาราง
      detailSheet.getRange(5, 1, rowValues.length + 1, headers.length).setBorder(
        true, true, true, true, true, true,
        "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID
      );

      // จัดกึ่งกลางคอลัมน์ ลำดับ, สถานะ, กำหนดส่ง
      detailSheet.getRange(6, 1, rowValues.length, 1).setHorizontalAlignment("center");
      detailSheet.getRange(6, 5, rowValues.length, 1).setHorizontalAlignment("center");
      detailSheet.getRange(6, 6, rowValues.length, 1).setHorizontalAlignment("center");
      detailSheet.getRange(6, 8, rowValues.length, 3).setHorizontalAlignment("center");
    }

    // Auto-fit columns
    for (let c = 1; c <= headers.length; c++) {
      detailSheet.autoResizeColumn(c);
    }

    // ==========================================
    // 2. สร้าง/อัปเดตแท็บ "สรุปภาพรวม" (KPI)
    // ==========================================
    let kpiSheet = ss.getSheetByName("สรุปภาพรวม");
    if (!kpiSheet) {
      kpiSheet = ss.insertSheet("สรุปภาพรวม", 0);
    }
    kpiSheet.clear();

    kpiSheet.getRange("A1").setValue("สรุปสถิติภาพรวมการส่งงานและตรวจประเมินวิชาการ");
    kpiSheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#1e3a8a");

    const kpi = data.kpiStats || {};
    const kpiData = [
      ["ตัวชี้วัด (KPI)", "จำนวน", "หน่วยนับ"],
      ["จำนวนครูผู้สอนทั้งหมดในระบบ", kpi.totalTeachers || 0, "คน"],
      ["จำนวนหัวข้อภาระงานที่มอบหมาย", kpi.totalTopics || 0, "รายการ"],
      ["จำนวนการส่งงานจริง", kpi.totalSubmissions || 0, "ครั้ง"],
      ["งานที่ผ่านการตรวจรับรองแล้ว (Passed)", kpi.passedSubmissions || 0, "รายการ"],
      ["งานที่ต้องส่งแก้ไขปรับปรุง (Revision)", kpi.revisionRequiredCount || 0, "รายการ"],
      ["อัตราความสำเร็จภาพรวม (Completion Rate)", (kpi.overallCompletionRate || 0) + "%", "เปอร์เซ็นต์"]
    ];

    const kpiRange = kpiSheet.getRange(3, 1, kpiData.length, 3);
    kpiRange.setValues(kpiData);
    kpiSheet.getRange(3, 1, 1, 3).setBackground("#2563eb").setFontColor("#ffffff").setFontWeight("bold");
    kpiSheet.getRange(3, 1, kpiData.length, 3).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
    kpiSheet.autoResizeColumn(1);
    kpiSheet.autoResizeColumn(2);
    kpiSheet.autoResizeColumn(3);

    // ลบชีตตั้งต้น "ชีต1" หากมี
    const defaultSheet = ss.getSheetByName("ชีต1");
    if (defaultSheet && ss.getSheets().length > 1) {
      try { ss.deleteSheet(defaultSheet); } catch (e) {}
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Synced " + rows.length + " rows to Google Sheet successfully",
      rowCount: rows.length,
      syncedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
