/**
 * Export an array of objects as a CSV file download.
 * @param {Array<Object>} data - Array of flat objects
 * @param {string} filename - Download filename (without extension)
 * @param {Array<{key: string, label: string}>} [columns] - Optional column definitions
 */
export function exportToCsv(data, filename, columns) {
  if (!data || data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    cols.map(c => {
      let val = row[c.key];
      if (val == null) val = '';
      if (val instanceof Date) val = val.toISOString();
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape quotes
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
