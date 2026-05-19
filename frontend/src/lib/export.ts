export interface CsvColumn {
  key: string;
  header: string;
}

export function exportCSV(
  filename: string,
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
): void {
  const header = columns.map((c) => `"${c.header}"`).join(',');
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  const csv = [header, ...body].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
