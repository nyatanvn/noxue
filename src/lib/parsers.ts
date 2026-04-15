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
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, 'text/html');
  
  let currentUnit = 'Unit 1';
  let allRows: Record<string, string>[] = [];
  let headers: string[] = [];

  const elements = Array.from(doc.body.children);
  
  for (const el of elements) {
    if (el.tagName.toLowerCase() === 'p' || el.tagName.toLowerCase() === 'h1' || el.tagName.toLowerCase() === 'h2' || el.tagName.toLowerCase() === 'h3') {
      const text = el.textContent?.trim() || '';
      if (/^(?:bài|unit)\s*\d+/i.test(text)) {
        currentUnit = text;
      }
    } else if (el.tagName.toLowerCase() === 'table') {
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length > 0) {
        // If headers are not set yet, use the first row of the first table
        let tableHeaders = Array.from(rows[0].querySelectorAll('td, th')).map(td => td.textContent?.trim() || '');
        let dataStartIndex = 1;

        if (headers.length === 0) {
          headers = tableHeaders;
        } else {
          // If this table doesn't have headers matching the first one, assume it has no headers
          // and data starts from index 0. (Simple heuristic)
          if (tableHeaders[0] !== headers[0]) {
            dataStartIndex = 0;
            tableHeaders = headers;
          }
        }

        const dataRows = rows.slice(dataStartIndex).map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const rowData: Record<string, string> = { _Unit: currentUnit };
          tableHeaders.forEach((header, i) => {
            if (header) {
              rowData[header] = cells[i]?.textContent?.trim() || '';
            }
          });
          return rowData;
        });
        allRows = allRows.concat(dataRows);
      }
    }
  }

  if (allRows.length > 0) {
    if (!headers.includes('_Unit')) {
      headers.push('_Unit');
    }
    return {
      headers,
      rows: allRows,
      name: file.name.replace(/\.[^/.]+$/, ""),
    };
  }

  // Fallback: split by lines if no table
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const text = result.value;
  const lines = text.split('\n').filter(l => l.trim());
  const dataRows = lines.map(line => {
    const parts = line.split(/[:\-\t]/); // Try common separators
    return {
      'Column 1': parts[0]?.trim() || '',
      'Column 2': parts.slice(1).join(':').trim() || '',
      '_Unit': 'Unit 1'
    };
  });

  return {
    headers: ['Column 1', 'Column 2', '_Unit'],
    rows: dataRows,
    name: file.name.replace(/\.[^/.]+$/, ""),
  };
}
