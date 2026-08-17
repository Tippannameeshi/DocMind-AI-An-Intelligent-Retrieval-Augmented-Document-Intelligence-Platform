const fs = require('fs');
const path = require('path');
const { parsePdf } = require('./pdfParser');
const { parseDocx } = require('./docxParser');

/**
 * Universal Document Parser supporting PDF, DOCX, TXT, MD, CSV, JSON, and code files.
 * @param {string} filePath - Absolute path to uploaded file.
 * @param {string} originalName - Original filename.
 * @returns {Promise<{ text: string, numPages: number, pages: Array<{ pageNumber: number, text: string }> }>}
 */
async function parseDocument(filePath, originalName = '') {
  const ext = path.extname(originalName || filePath).toLowerCase();

  // 1. PDF File Parsing
  if (ext === '.pdf') {
    return await parsePdf(filePath);
  }

  // 2. Word Document (DOCX / DOC) Parsing
  if (ext === '.docx' || ext === '.doc') {
    return await parseDocx(filePath);
  }

  // 3. Text / Markdown / Code / JSON / CSV / Log File Parsing
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const cleanContent = rawContent.trim();

  if (!cleanContent) {
    return { text: '', numPages: 1, pages: [{ pageNumber: 1, text: '' }] };
  }

  // Split text into section "pages" (~1500 chars each for logical page numbering)
  const pageSize = 1500;
  const pages = [];
  let pageNum = 1;

  for (let i = 0; i < cleanContent.length; i += pageSize) {
    const slice = cleanContent.slice(i, i + pageSize);
    pages.push({
      pageNumber: pageNum++,
      text: slice.trim(),
    });
  }

  return {
    text: cleanContent,
    numPages: pages.length,
    pages,
  };
}

module.exports = { parseDocument };

