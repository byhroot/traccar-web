import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import store from '../../store';

const borderDefinition = {
  top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
};

const exportExcel = async (title, fileName, sheets, theme) => {
  if (sheets.size === 0) return;

  const serverName = store.getState().session.server.attributes?.title || 'TakipOn';
  const serverDescription = "Her araç için ayrı sekme oluşturuldu. Excel'in alt kısmındaki sekmelere tıklayarak araçlar arasında geçiş yapabilirsiniz.";

  const workbook = new ExcelJS.Workbook();
  const primaryArgb = `FF${theme.palette.primary.main.replace('#', '').toUpperCase()}`;
  const zebraArgb = 'FFF5F5F5';

  for (const [sheetTitle, rows] of sheets) {   // forEach → for...of
    const worksheet = workbook.addWorksheet(sheetTitle, {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    const headers = Object.keys(rows[0]);

    // ── Marka adı satırı ──────────────────────────────────────────
    const brandRow = worksheet.addRow([serverName]);
    if (headers.length > 1) worksheet.mergeCells(1, 1, 1, headers.length);
    brandRow.height = 36;
    brandRow.font = { bold: true, size: 18 };
    brandRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Açıklama satırı ───────────────────────────────────────────
    const descRow = worksheet.addRow([serverDescription]);
    if (headers.length > 1) worksheet.mergeCells(2, 1, 2, headers.length);
    descRow.height = 24;
    descRow.font = { size: 10, italic: true };
    descRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // ── Rapor başlığı satırı ──────────────────────────────────────
    const titleRow = worksheet.addRow([title]);
    if (headers.length > 1) worksheet.mergeCells(3, 1, 3, headers.length);
    titleRow.height = 30;
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Header row ────────────────────────────────────────────────
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.border = borderDefinition;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryArgb } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // ── Data rows (zebra) ─────────────────────────────────────────
    rows.forEach((item, rowIndex) => {
      const values = headers.map((header) => item[header]);
      const row = worksheet.addRow(values);
      row.height = 20;
      const isEven = rowIndex % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = borderDefinition;
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : zebraArgb },
        };
      });
    });

    // ── Kolon genişlikleri ────────────────────────────────────────
    headers.forEach((header, index) => {
      let maxLength = String(header).length;
      rows.forEach((item) => {
        const value = item[header];
        if (value !== null && value !== undefined) {
          maxLength = Math.max(maxLength, String(value).length);
        }
      });
      worksheet.getColumn(index + 1).width = Math.max(maxLength + 4, 12);
    });

    // ── Sayfa koruma (salt okunur) ────────────────────────────────
    await worksheet.protect('takipon2024', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertRows: false,
      insertColumns: false,
      deleteRows: false,
      deleteColumns: false,
      sort: false,
      autoFilter: false,
    });
  }

  const blob = new Blob([await workbook.xlsx.writeBuffer()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
};

export default exportExcel;