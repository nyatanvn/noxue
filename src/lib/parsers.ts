import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { RawData } from '../types';

export async function parseXlsx(file: File): Promise<RawData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
        
        if (json.length === 0) {
          throw new Error('The file is empty or has no valid data.');
        }

        const headers = Object.keys(json[0]);
        resolve({
          headers,
          rows: json,
          name: file.name.replace(/\.[^/.]+$/, ""),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function parseDocx(file: File): Promise<RawData> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  
  // Simple parser for docx: assume lines or simple table-like structure
  // For better results, we could use mammoth.convertToHtml and parse tables,
  // but let's start with a simple line-based approach or look for patterns.
  // Actually, mammoth can extract tables if we use convertToHtml.
  
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, 'text/html');
  const tables = doc.querySelectorAll('table');
  
  if (tables.length > 0) {
    const table = tables[0];
    const rows = Array.from(table.querySelectorAll('tr'));
    const headers = Array.from(rows[0].querySelectorAll('td, th')).map(td => td.textContent?.trim() || '');
    const dataRows = rows.slice(1).map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const rowData: Record<string, string> = {};
      headers.forEach((header, i) => {
        rowData[header] = cells[i]?.textContent?.trim() || '';
      });
      return rowData;
    });
    
    return {
      headers,
      rows: dataRows,
      name: file.name.replace(/\.[^/.]+$/, ""),
    };
  }

  // Fallback: split by lines if no table
  const lines = text.split('\n').filter(l => l.trim());
  const dataRows = lines.map(line => {
    const parts = line.split(/[:\-\t]/); // Try common separators
    return {
      'Column 1': parts[0]?.trim() || '',
      'Column 2': parts.slice(1).join(':').trim() || '',
    };
  });

  return {
    headers: ['Column 1', 'Column 2'],
    rows: dataRows,
    name: file.name.replace(/\.[^/.]+$/, ""),
  };
}
