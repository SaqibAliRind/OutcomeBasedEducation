import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// ─────────────────────────────────────────────────────────────
// EXCEL HELPERS
// ─────────────────────────────────────────────────────────────

const BRAND_COLOR = '1E3A5F';    // Dark navy
const ACCENT_COLOR = '2E86AB';   // Blue
const HEADER_FILL = 'D6E4F0';    // Light blue
const ALT_ROW_FILL = 'F0F7FF';

const applyHeaderStyle = (row, bgColor = BRAND_COLOR, fontColor = 'FFFFFF') => {
    row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } };
        cell.font = { bold: true, color: { argb: `FF${fontColor}` }, name: 'Calibri', size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF999999' } },
            bottom: { style: 'thin', color: { argb: 'FF999999' } },
            left: { style: 'thin', color: { argb: 'FF999999' } },
            right: { style: 'thin', color: { argb: 'FF999999' } }
        };
    });
};

const applyDataRowStyle = (row, altRow = false) => {
    row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow ? `FF${ALT_ROW_FILL}` : 'FFFFFFFF' } };
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
            bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
            left: { style: 'hair', color: { argb: 'FFCCCCCC' } },
            right: { style: 'hair', color: { argb: 'FFCCCCCC' } }
        };
    });
    row.height = 20;
};

const addTitleBlock = (ws, title, subtitle = '') => {
    const titleRow = ws.addRow([title]);
    titleRow.height = 30;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { bold: true, size: 16, color: { argb: `FF${BRAND_COLOR}` }, name: 'Calibri' };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

    if (subtitle) {
        const subRow = ws.addRow([subtitle]);
        subRow.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF666666' }, name: 'Calibri' };
    }

    const genRow = ws.addRow([`Generated: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`]);
    genRow.getCell(1).font = { size: 9, color: { argb: 'FF999999' }, name: 'Calibri' };

    ws.addRow([]);
};

// ─────────────────────────────────────────────────────────────
// EXCEL EXPORT GENERATORS
// ─────────────────────────────────────────────────────────────

export const generateCLOAchievementExcel = async (data) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Al-Kawthar OBE System';
    wb.created = new Date();

    const ws = wb.addWorksheet('CLO Achievement Report', { pageSetup: { fitToPage: true, orientation: 'landscape' } });
    ws.columns = [
        { key: 'clo', width: 15 },
        { key: 'description', width: 35 },
        { key: 'course', width: 25 },
        { key: 'target', width: 12 },
        { key: 'achieved', width: 15 },
        { key: 'attainmentRate', width: 18 },
        { key: 'status', width: 12 }
    ];

    ws.mergeCells('A1:G1');
    addTitleBlock(ws, 'CLO Achievement Report', 'Al-Kawthar University – OBE System');

    const header = ws.addRow(['CLO Code', 'Description', 'Course', 'Target (%)', 'Achieved (%)', 'Attainment Rate (%)', 'Status']);
    applyHeaderStyle(header);

    (data.clos || []).forEach((row, i) => {
        const dataRow = ws.addRow([
            row.clo,
            row.description || '—',
            row.course,
            row.target,
            row.achieved,
            row.attainmentRate ?? '—',
            row.status
        ]);
        applyDataRowStyle(dataRow, i % 2 === 1);

        // Color the status cell
        const statusCell = dataRow.getCell(7);
        statusCell.font = { bold: true, color: { argb: row.status === 'Met' ? 'FF006400' : 'FF8B0000' }, name: 'Calibri', size: 10 };
    });

    // Summary row
    ws.addRow([]);
    const sumRow = ws.addRow([`Total: ${data.total}`, '', `Achieved: ${data.achieved}`, '', `Not Met: ${data.notAchieved}`, '', '']);
    applyHeaderStyle(sumRow, ACCENT_COLOR, 'FFFFFF');

    return wb;
};

export const generatePLOAchievementExcel = async (data) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Al-Kawthar OBE System';

    const ws = wb.addWorksheet('PLO Achievement Report', { pageSetup: { fitToPage: true, orientation: 'landscape' } });
    ws.columns = [
        { key: 'plo', width: 15 }, { key: 'description', width: 35 }, { key: 'program', width: 25 },
        { key: 'target', width: 12 }, { key: 'achieved', width: 15 }, { key: 'attainmentRate', width: 18 }, { key: 'status', width: 12 }
    ];

    ws.mergeCells('A1:G1');
    addTitleBlock(ws, 'PLO Achievement Report', 'Al-Kawthar University – OBE System');

    const header = ws.addRow(['PLO Code', 'Description', 'Program', 'Target (%)', 'Achieved (%)', 'Attainment Rate (%)', 'Status']);
    applyHeaderStyle(header);

    (data.plos || []).forEach((row, i) => {
        const dataRow = ws.addRow([row.plo, row.description || '—', row.program, row.target, row.achieved, row.attainmentRate ?? '—', row.status]);
        applyDataRowStyle(dataRow, i % 2 === 1);
        const statusCell = dataRow.getCell(7);
        statusCell.font = { bold: true, color: { argb: row.status === 'Met' ? 'FF006400' : 'FF8B0000' }, name: 'Calibri', size: 10 };
    });

    ws.addRow([]);
    const sumRow = ws.addRow([`Total: ${data.total}`, '', `Achieved: ${data.achieved}`, '', `Not Met: ${data.notAchieved}`, '', '']);
    applyHeaderStyle(sumRow, ACCENT_COLOR, 'FFFFFF');

    return wb;
};

export const generateCQIActionRegisterExcel = async (data) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Al-Kawthar OBE System';

    const ws = wb.addWorksheet('CQI Action Register', { pageSetup: { fitToPage: true, orientation: 'landscape' } });
    ws.columns = [
        { key: 'id', width: 15 }, { key: 'courseCode', width: 14 }, { key: 'courseName', width: 25 },
        { key: 'weakCLO', width: 12 }, { key: 'rootCause', width: 30 }, { key: 'correctiveAction', width: 30 },
        { key: 'responsiblePerson', width: 22 }, { key: 'targetDate', width: 14 }, { key: 'status', width: 14 }
    ];

    ws.mergeCells('A1:I1');
    addTitleBlock(ws, 'CQI Action Register – Closing the Loop', 'Al-Kawthar University – OBE System');

    const header = ws.addRow(['ID', 'Course Code', 'Course Name', 'Weak CLO', 'Root Cause', 'Corrective Action', 'Responsible', 'Target Date', 'Status']);
    applyHeaderStyle(header);

    const STATUS_COLORS = { Completed: 'FF006400', 'In Progress': 'FF8B6914', Pending: 'FF8B0000' };

    (data.actions || []).forEach((row, i) => {
        const dataRow = ws.addRow([row.id, row.courseCode, row.courseName, row.weakCLO, row.rootCause, row.correctiveAction || row.action || '—', row.responsiblePerson, row.targetDate, row.status]);
        applyDataRowStyle(dataRow, i % 2 === 1);
        const statusCell = dataRow.getCell(9);
        statusCell.font = { bold: true, color: { argb: STATUS_COLORS[row.status] || 'FF333333' }, name: 'Calibri', size: 10 };
    });

    ws.addRow([]);
    const sumRow = ws.addRow([`Total: ${data.total}`, '', '', '', `Completed: ${data.completed}`, `In Progress: ${data.inProgress}`, '', `Pending: ${data.pending}`, '']);
    applyHeaderStyle(sumRow, ACCENT_COLOR, 'FFFFFF');

    return wb;
};

export const generateMarksExcel = async (data) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Al-Kawthar OBE System';
    const ws = wb.addWorksheet('Marks Report');

    ws.columns = [
        { key: 'studentName', width: 28 }, { key: 'courseName', width: 30 }, { key: 'courseCode', width: 14 },
        { key: 'session', width: 16 }, { key: 'grade', width: 10 }
    ];

    ws.mergeCells('A1:E1');
    addTitleBlock(ws, 'Marks / Grade Report', 'Al-Kawthar University');
    const header = ws.addRow(['Student Name', 'Course Name', 'Course Code', 'Session', 'Grade']);
    applyHeaderStyle(header);

    (data || []).forEach((row, i) => {
        const dataRow = ws.addRow([row.studentName, row.courseName, row.courseCode, row.session, row.grade]);
        applyDataRowStyle(dataRow, i % 2 === 1);
    });

    return wb;
};

export const generateGenericExcel = async (title, headers, rows) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Al-Kawthar OBE System';
    const ws = wb.addWorksheet(title.substring(0, 31));

    ws.columns = headers.map(h => ({ key: h.key, width: h.width || 20 }));
    addTitleBlock(ws, title, 'Al-Kawthar University – OBE System');

    const headerRow = ws.addRow(headers.map(h => h.label));
    applyHeaderStyle(headerRow);

    rows.forEach((row, i) => {
        const dataRow = ws.addRow(headers.map(h => row[h.key] ?? '—'));
        applyDataRowStyle(dataRow, i % 2 === 1);
    });

    return wb;
};

// ─────────────────────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────────────────────

export const generateCSV = (headers, rows) => {
    const escape = (val) => {
        const str = String(val ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };
    const csvLines = [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(','))
    ];
    return csvLines.join('\r\n');
};

// ─────────────────────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────────────────────

const PDF_MARGIN = 40;
const PDF_BRAND_COLOR = '#1E3A5F';
const PDF_ACCENT = '#2E86AB';

export const generatePDF = (title, subtitle, headers, rows, res) => {
    const doc = new PDFDocument({ margin: PDF_MARGIN, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Title page header
    doc
        .fillColor(PDF_BRAND_COLOR)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('AL-KAWTHAR UNIVERSITY', PDF_MARGIN, PDF_MARGIN)
        .fontSize(14)
        .text(title, { continued: false })
        .fillColor('#666666')
        .fontSize(10)
        .font('Helvetica')
        .text(subtitle)
        .text(`Generated: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`)
        .moveDown(1);

    // Divider
    doc
        .moveTo(PDF_MARGIN, doc.y)
        .lineTo(doc.page.width - PDF_MARGIN, doc.y)
        .strokeColor(PDF_ACCENT)
        .lineWidth(2)
        .stroke()
        .moveDown(0.5);

    // Table
    const pageWidth = doc.page.width - PDF_MARGIN * 2;
    const colWidth = pageWidth / headers.length;
    const rowHeight = 20;
    const tableTop = doc.y;

    // Header row
    doc.fillColor(PDF_BRAND_COLOR).font('Helvetica-Bold').fontSize(9);
    headers.forEach((h, i) => {
        doc.text(h, PDF_MARGIN + i * colWidth, tableTop, { width: colWidth - 4, align: 'center' });
    });

    let y = tableTop + rowHeight;
    doc.fillColor(PDF_BRAND_COLOR).moveTo(PDF_MARGIN, y).lineTo(doc.page.width - PDF_MARGIN, y).stroke();
    y += 4;

    // Data rows
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, ri) => {
        if (y > doc.page.height - 80) {
            doc.addPage();
            y = PDF_MARGIN;
        }

        // Alternating row background
        if (ri % 2 === 0) {
            doc.fillColor('#EAF2FB').rect(PDF_MARGIN, y - 2, pageWidth, rowHeight).fill();
        }

        doc.fillColor('#1A1A1A');
        row.forEach((cell, i) => {
            doc.text(String(cell ?? '—'), PDF_MARGIN + i * colWidth, y, { width: colWidth - 4, align: 'center', ellipsis: true });
        });

        y += rowHeight;
        // Subtle row separator
        doc.fillColor('#CCCCCC').moveTo(PDF_MARGIN, y - 1).lineTo(doc.page.width - PDF_MARGIN, y - 1).lineWidth(0.3).stroke();
    });

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor('#999999').fontSize(8).text(
            `Al-Kawthar University OBE System  |  Page ${i + 1} of ${pageCount}  |  Confidential`,
            PDF_MARGIN, doc.page.height - 30,
            { align: 'center', width: pageWidth }
        );
    }

    doc.end();
};
