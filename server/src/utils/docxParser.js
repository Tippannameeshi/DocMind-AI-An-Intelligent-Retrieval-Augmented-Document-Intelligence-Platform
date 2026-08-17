const mammoth = require('mammoth');
const fs = require('fs');

/**
 * Utility to extract raw text from Word DOCX / DOC documents and split into structured pages.
 * @param {string} filePath - Absolute path to uploaded DOCX file.
 * @returns {Promise<{ text: string, numPages: number, pages: Array<{ pageNumber: number, text: string }> }>}
 */
async function parseDocx(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const rawContent = (result.value || '').trim();

    if (!rawContent) {
      return { text: '', numPages: 1, pages: [{ pageNumber: 1, text: '' }] };
    }

    // Split raw text into virtual pages (~1500 chars each) preserving document structure
    const pageSize = 1500;
    const pages = [];
    let pageNum = 1;

    for (let i = 0; i < rawContent.length; i += pageSize) {
      const slice = rawContent.slice(i, i + pageSize);
      pages.push({
        pageNumber: pageNum++,
        text: slice.trim(),
      });
    }

    return {
      text: rawContent,
      numPages: pages.length,
      pages,
    };
  } catch (err) {
    throw new Error(`Failed to parse Word document: ${err.message}`);
  }
}

module.exports = { parseDocx };
