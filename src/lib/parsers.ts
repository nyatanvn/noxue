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
  console.log("parseDocx started for file:", file.name);
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  console.log("Mammoth HTML generated. Length:", htmlResult.value.length);
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, 'text/html');
  
  let currentUnit = 'Unit 1';
  let allRows: Record<string, string>[] = [];
  let headers: string[] = [];

  const elements = Array.from(doc.body.children);
  console.log("Top-level elements found:", elements.length);
  
  for (const el of elements) {
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      const text = el.textContent?.trim() || '';
      // Improved regex to catch "Bài 1", "Bài: 1", "Unit 01", etc.
      if (/^(?:bài|unit)\s*[:\-]?\s*\d+/i.test(text)) {
        currentUnit = text;
        console.log("--> Unit recognized outside table:", currentUnit);
      }
    } else if (tagName === 'table') {
      console.log("--> Table found. Current unit:", currentUnit);
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length > 0) {
        
        let headerRowIndex = 0;
        let currentTableHeaders: string[] = [];
        
        // Find the true header row (skip initial Unit rows inside the table)
        for (let i = 0; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('td, th')).map(td => td.textContent?.trim() || '');
          const nonEmpties = cells.filter(t => t.length > 0);
          
          if (nonEmpties.length === 1 && /^(?:bài|unit)\s*[:\-]?\s*\d+/i.test(nonEmpties[0])) {
            currentUnit = nonEmpties[0];
            console.log("--> Unit recognized at top of table:", currentUnit);
            continue;
          }
          
          if (nonEmpties.length > 0) {
            currentTableHeaders = cells;
            headerRowIndex = i;
            break;
          }
        }

        let dataStartIndex = headerRowIndex + 1;

        if (headers.length === 0) {
          headers = currentTableHeaders;
        } else {
          // If this table doesn't have headers matching the first one, assume it has no headers
          if (currentTableHeaders[0] !== headers[0]) {
            dataStartIndex = headerRowIndex; // It's data, not headers
            currentTableHeaders = headers;
          }
        }

        const dataRows: Record<string, string>[] = [];
        const rowsToProcess = rows.slice(dataStartIndex);
        
        for (const row of rowsToProcess) {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const cellTexts = cells.map(c => c.textContent?.trim() || '');
          const nonEmpties = cellTexts.filter(t => t.length > 0);
          
          // Check if this row is a unit header inside the table
          const firstCellText = cellTexts[0] || '';
          const isUnitRow = nonEmpties.length > 0 && nonEmpties.length <= 2 && /^(?:bài|unit)\s*[:\-]?\s*\d+/i.test(firstCellText);

          if (isUnitRow) {
            currentUnit = nonEmpties.join(' ').trim();
            console.log("--> Unit recognized inside table:", currentUnit);
            continue; // Skip adding this row as a flashcard
          }

          const rowData: Record<string, string> = { _Unit: currentUnit };
          let hasData = false;
          currentTableHeaders.forEach((header, i) => {
            if (header) {
              rowData[header] = cellTexts[i] || '';
              if (rowData[header]) hasData = true;
            }
          });
          
          if (hasData) {
            dataRows.push(rowData);
          }
        }
        allRows = allRows.concat(dataRows);
        console.log(`Parsed ${dataRows.length} rows from table.`);
      }
    }
  }

  if (allRows.length > 0) {
    if (!headers.includes('_Unit')) {
      headers.push('_Unit');
    }
    console.log("Successfully parsed tables. Total rows:", allRows.length);
    return {
      headers,
      rows: allRows,
      name: file.name.replace(/\.[^/.]+$/, ""),
    };
  }

  console.log("No tables found. Falling back to raw text parsing.");
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
