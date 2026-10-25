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
    const updateTimeStr = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) + " น.";

    // ==========================================
    // 1. สร้าง/อัปเดตแท็บ "ตาราง Dashboard" (The 2D Matrix Dashboard)
    // ==========================================
    let dashSheet = ss.getSheetByName("ตาราง Dashboard");
    if (!dashSheet) {
      dashSheet = ss.insertSheet("ตาราง Dashboard", 0);
    } else {
      ss.setActiveSheet(dashSheet);
      ss.moveActiveSheet(1);
    }
    dashSheet.clear();

    const matrix = data.matrixDashboard || {};
    const topics = matrix.topics || [];
    const matrixRows = matrix.rows || [];
    const kpi = data.kpiStats || {};

    // Header Title
    dashSheet.getRange("A1").setValue(data.schoolName || "โรงเรียนสารสาสน์วิเทศราชพฤกษ์");
    dashSheet.getRange("A1").setFontSize(16).setFontWeight("bold").setFontColor("#1e3a8a");

    dashSheet.getRange("A2").setValue(
      "ตาราง DASHBOARD ภาพรวมการส่งงานครูและผลการตรวจประเมินวิชาการ (ปีการศึกษา " + (data.academicYear || "2569") + " / " + (data.semester || "1") + ")"
    );
    dashSheet.getRange("A2").setFontSize(11).setFontWeight("bold").setFontColor("#334155");

    dashSheet.getRange("A3").setValue(
      "อัปเดตล่าสุด: " + updateTimeStr + 
      " • ออกแบบและพัฒนาระบบโดย: ม.กฤตพจน์ แก้วกา" +
      " • สาเหตุการซิงค์: " + (data.triggerReason || "AUTO_SYNC")
    );
    dashSheet.getRange("A3").setFontSize(9).setFontColor("#64748b");

    // ----------------------------------------------------
    // Executive KPI Summary Cards (Row 5 - Row 6)
    // ----------------------------------------------------
    const kpiHeaders = [
      "ครูผู้สอนทั้งหมด",
      "หัวข้องานทั้งหมด",
      "ส่งครบ 100%",
      "ส่งบางส่วน",
      "ยังไม่ส่งงาน",
      "ความสำเร็จรวม"
    ];
    const kpiValues = [
      (kpi.totalTeachers || matrixRows.length) + " คน",
      topics.length + " หัวข้อ",
      (kpi.completed100PercentTeachers || 0) + " คน",
      (kpi.partialTeachers || 0) + " คน",
      (kpi.zeroTeachers || 0) + " คน",
      (kpi.overallCompletionRate || 0) + "%"
    ];

    dashSheet.getRange(5, 1, 1, 6).setValues([kpiHeaders]);
    dashSheet.getRange(5, 1, 1, 6).setBackground("#f1f5f9").setFontColor("#475569").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");

    dashSheet.getRange(6, 1, 1, 6).setValues([kpiValues]);
    dashSheet.getRange(6, 1, 1, 6).setFontSize(14).setFontWeight("bold").setHorizontalAlignment("center");
    dashSheet.getRange(6, 1).setFontColor("#1e40af"); // Total teachers
    dashSheet.getRange(6, 2).setFontColor("#6b21a8"); // Total topics
    dashSheet.getRange(6, 3).setFontColor("#16a34a"); // 100% completed
    dashSheet.getRange(6, 4).setFontColor("#d97706"); // Partial
    dashSheet.getRange(6, 5).setFontColor("#dc2626"); // Zero
    dashSheet.getRange(6, 6).setFontColor("#0284c7"); // Rate
    dashSheet.getRange(5, 1, 2, 6).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

    // ----------------------------------------------------
    // Matrix Table (Starting Row 8)
    // ----------------------------------------------------
    dashSheet.getRange("A8").setValue("📊 ตารางติดตามการส่งงานครูรายบุคคล (Teacher Submission Matrix Dashboard)");
    dashSheet.getRange("A8").setFontSize(11).setFontWeight("bold").setFontColor("#1e293b");

    // Build Table Column Headers
    const matrixColHeaders = [
      "ลำดับ",
      "ชื่อ-นามสกุลครูผู้สอน",
      "กลุ่มสาระการเรียนรู้"
    ];
    topics.forEach((t, i) => {
      matrixColHeaders.push((i + 1) + ". " + t.title);
    });
    matrixColHeaders.push("ส่งแล้ว (งาน)", "ภาระงานทั้งหมด", "คิดเป็น %", "สถานะภาพรวม");

    const headerRange = dashSheet.getRange(9, 1, 1, matrixColHeaders.length);
    headerRange.setValues([matrixColHeaders]);
    headerRange.setBackground("#1e40af"); // Deep Blue
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");

    // Populate Teacher Rows
    if (matrixRows.length > 0) {
      const allRowData = [];
      const cellBackgrounds = [];
      const cellFontColors = [];

      matrixRows.forEach((r, rIdx) => {
        const rowVals = [
          r.no,
          r.teacherName,
          r.department
        ];
        const rowBg = ["#ffffff", "#ffffff", "#ffffff"];
        const rowFg = ["#000000", "#000000", "#334155"];

        topics.forEach(t => {
          const c = r.cells ? r.cells[t.id] : null;
          const status = c ? c.status : 'not_submitted';
          const txt = c ? c.statusText : '❌ ยังไม่ส่ง';

          rowVals.push(txt);
          if (status === 'passed') {
            rowBg.push("#dcfce7"); // Green
            rowFg.push("#15803d");
          } else if (status === 'submitted') {
            rowBg.push("#e0e7ff"); // Blue
            rowFg.push("#3730a3");
          } else if (status === 'revision_required') {
            rowBg.push("#fef3c7"); // Amber
            rowFg.push("#b45309");
          } else {
            rowBg.push("#fee2e2"); // Rose Red
            rowFg.push("#b91c1c");
          }
        });

        rowVals.push(
          r.submittedCount + " งาน",
          r.totalTopics + " งาน",
          (r.completionRate || 0) + "%",
          r.overallStatus || "-"
        );
        rowBg.push("#f8fafc", "#f8fafc", "#f8fafc", "#f8fafc");
        rowFg.push("#0f172a", "#0f172a", "#1e40af", "#0f172a");

        allRowData.push(rowVals);
        cellBackgrounds.push(rowBg);
        cellFontColors.push(rowFg);
      });

      const dataRange = dashSheet.getRange(10, 1, allRowData.length, matrixColHeaders.length);
      dataRange.setValues(allRowData);
      dataRange.setBackgrounds(cellBackgrounds);
      dataRange.setFontColors(cellFontColors);
      dataRange.setFontSize(9.5);
      dataRange.setVerticalAlignment("middle");

      // Alignment
      dashSheet.getRange(10, 1, allRowData.length, 1).setHorizontalAlignment("center");
      dashSheet.getRange(10, 4, allRowData.length, matrixColHeaders.length - 3).setHorizontalAlignment("center");

      // Borders
      dashSheet.getRange(9, 1, allRowData.length + 1, matrixColHeaders.length).setBorder(
        true, true, true, true, true, true,
        "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID
      );

      // ----------------------------------------------------
      // Summary Footer Row (At the bottom of Matrix Table)
      // ----------------------------------------------------
      const footerRowIndex = 10 + allRowData.length;
      const footerVals = ["", "สรุปจำนวนครูที่ส่งในแต่ละหัวข้อ", ""];
      const topicStats = matrix.topicStats || {};

      topics.forEach(t => {
        const stat = topicStats[t.id];
        if (stat) {
          footerVals.push(stat.submittedCount + "/" + matrixRows.length + " คน (" + stat.rate + "%)");
        } else {
          footerVals.push("-");
        }
      });

      footerVals.push(
        (kpi.totalSubmissions || 0) + " งาน",
        (matrixRows.length * topics.length) + " งาน",
        (kpi.overallCompletionRate || 0) + "%",
        "ภาพรวมทั้งโรงเรียน"
      );

      const footerRange = dashSheet.getRange(footerRowIndex, 1, 1, matrixColHeaders.length);
      footerRange.setValues([footerVals]);
      footerRange.setBackground("#e2e8f0");
      footerRange.setFontColor("#0f172a");
      footerRange.setFontWeight("bold");
      footerRange.setFontSize(9.5);
      footerRange.setHorizontalAlignment("center");
      footerRange.setVerticalAlignment("middle");
      dashSheet.getRange(footerRowIndex, 1, 1, matrixColHeaders.length).setBorder(
        true, true, true, true, true, true,
        "#94a3b8", SpreadsheetApp.BorderStyle.SOLID
      );
    }

    for (let c = 1; c <= Math.min(matrixColHeaders.length, 25); c++) {
      dashSheet.autoResizeColumn(c);
    }

    // ==========================================
    // 2. สร้าง/อัปเดตแท็บ "รายชื่อครูผู้สอน" (Teachers Roster)
    // ==========================================
    let teacherSheet = ss.getSheetByName("รายชื่อครูผู้สอน");
    if (!teacherSheet) {
      teacherSheet = ss.insertSheet("รายชื่อครูผู้สอน", 1);
    }
    teacherSheet.clear();

    teacherSheet.getRange("A1").setValue(data.schoolName || "โรงเรียนสารสาสน์วิเทศราชพฤกษ์");
    teacherSheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#1e3a8a");

    teacherSheet.getRange("A2").setValue(
      "บัญชีรายชื่อครูผู้สอนประจำการ (ปีการศึกษา " + (data.academicYear || "2569") + " / " + (data.semester || "1") + ")" +
      " • รวม " + ((data.teachersRoster || []).length) + " ท่าน (ไม่รวม Admin)"
    );
    teacherSheet.getRange("A2").setFontSize(11).setFontWeight("bold").setFontColor("#475569");

    teacherSheet.getRange("A3").setValue(
      "อัปเดตล่าสุด: " + updateTimeStr + " | ออกแบบและพัฒนาระบบโดย: ม.กฤตพจน์ แก้วกา"
    );
    teacherSheet.getRange("A3").setFontSize(9).setFontColor("#64748b");

    const teacherHeaders = [
      "ลำดับ",
      "ชื่อ-นามสกุลครูผู้สอน",
      "อีเมล / บัญชีผู้ใช้",
      "กลุ่มสาระการเรียนรู้",
      "รายวิชาที่สอน",
      "ระดับชั้นที่สอน",
      "เบอร์โทรศัพท์",
      "ภาระงานที่ส่งแล้ว",
      "ผ่านการรับรอง",
      "สถานะบัญชี"
    ];

    const teacherHeaderRange = teacherSheet.getRange(5, 1, 1, teacherHeaders.length);
    teacherHeaderRange.setValues([teacherHeaders]);
    teacherHeaderRange.setBackground("#0d9488"); // Teal color
    teacherHeaderRange.setFontColor("#ffffff");
    teacherHeaderRange.setFontWeight("bold");
    teacherHeaderRange.setHorizontalAlignment("center");
    teacherHeaderRange.setVerticalAlignment("middle");

    const roster = data.teachersRoster || [];
    if (roster.length > 0) {
      const rosterRows = roster.map(t => [
        t.no,
        t.displayName,
        t.email,
        t.department,
        t.subjects,
        t.grades,
        t.phone,
        t.submittedCount + " รายการ",
        t.passedCount + " รายการ",
        t.status
      ]);

      const rosterRange = teacherSheet.getRange(6, 1, rosterRows.length, teacherHeaders.length);
      rosterRange.setValues(rosterRows);
      rosterRange.setFontSize(10);
      rosterRange.setVerticalAlignment("middle");

      teacherSheet.getRange(5, 1, rosterRows.length + 1, teacherHeaders.length).setBorder(
        true, true, true, true, true, true,
        "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID
      );

      teacherSheet.getRange(6, 1, rosterRows.length, 1).setHorizontalAlignment("center");
      teacherSheet.getRange(6, 6, rosterRows.length, 5).setHorizontalAlignment("center");
    }

    for (let c = 1; c <= teacherHeaders.length; c++) {
      teacherSheet.autoResizeColumn(c);
    }

    // ==========================================
    // 3. สร้าง/อัปเดตแท็บ "รายการส่งงานละเอียด" (Detail Log)
    // ==========================================
    let detailSheet = ss.getSheetByName("รายการส่งงานละเอียด");
    if (!detailSheet) {
      detailSheet = ss.insertSheet("รายการส่งงานละเอียด", 2);
    }
    detailSheet.clear();

    detailSheet.getRange("A1").setValue(data.schoolName || "โรงเรียนสารสาสน์วิเทศราชพฤกษ์");
    detailSheet.getRange("A1").setFontSize(14).setFontWeight("bold").setFontColor("#1e3a8a");

    detailSheet.getRange("A2").setValue(
      "บันทึกประวัติการส่งงานครูและผลการตรวจประเมินวิชาการรายรายการ (ปีการศึกษา " + (data.academicYear || "2569") + " / " + (data.semester || "1") + ")"
    );
    detailSheet.getRange("A2").setFontSize(11).setFontWeight("bold").setFontColor("#475569");

    detailSheet.getRange("A3").setValue(
      "อัปเดตล่าสุด: " + updateTimeStr + 
      " • ออกแบบและพัฒนาระบบโดย: ม.กฤตพจน์ แก้วกา"
    );
    detailSheet.getRange("A3").setFontSize(9).setFontColor("#64748b");

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

    const dHeaderRange = detailSheet.getRange(5, 1, 1, headers.length);
    dHeaderRange.setValues([headers]);
    dHeaderRange.setBackground("#475569");
    dHeaderRange.setFontColor("#ffffff");
    dHeaderRange.setFontWeight("bold");
    dHeaderRange.setHorizontalAlignment("center");
    dHeaderRange.setVerticalAlignment("middle");

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

      const dDataRange = detailSheet.getRange(6, 1, rowValues.length, headers.length);
      dDataRange.setValues(rowValues);
      dDataRange.setFontSize(10);
      dDataRange.setVerticalAlignment("middle");

      detailSheet.getRange(5, 1, rowValues.length + 1, headers.length).setBorder(
        true, true, true, true, true, true,
        "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID
      );

      detailSheet.getRange(6, 1, rowValues.length, 1).setHorizontalAlignment("center");
      detailSheet.getRange(6, 5, rowValues.length, 1).setHorizontalAlignment("center");
      detailSheet.getRange(6, 6, rowValues.length, 1).setHorizontalAlignment("center");
      detailSheet.getRange(6, 8, rowValues.length, 3).setHorizontalAlignment("center");
    }

    for (let c = 1; c <= headers.length; c++) {
      detailSheet.autoResizeColumn(c);
    }

    // ลบชีตตั้งต้น "ชีต1" หรือ "สรุปภาพรวม" หากมีชีตใหม่แล้ว
    const oldSheet = ss.getSheetByName("ชีต1");
    if (oldSheet && ss.getSheets().length > 1) {
      try { ss.deleteSheet(oldSheet); } catch (e) {}
    }
    const oldKpi = ss.getSheetByName("สรุปภาพรวม");
    if (oldKpi && ss.getSheets().length > 1) {
      try { ss.deleteSheet(oldKpi); } catch (e) {}
    }

    // Active sheet เป็นแท็บตาราง Dashboard
    ss.setActiveSheet(dashSheet);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Synced " + matrixRows.length + " teachers and " + topics.length + " topics into Dashboard Table successfully",
      teachersCount: matrixRows.length,
      topicsCount: topics.length,
      syncedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
