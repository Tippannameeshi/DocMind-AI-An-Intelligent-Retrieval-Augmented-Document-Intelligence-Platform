const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Utility to extract text from a PDF file page by page.
 * @param {string} filePath - Absolute path to the uploaded PDF file.
 * @returns {Promise<{ text: string, numPages: number, pages: Array<{ pageNumber: number, text: string }> }>}
 */
async function parsePdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);

  const pages = [];
  
  // Custom pager function to capture per-page text content
  const renderPage = (pageData) => {
    return pageData.getTextContent().then((textContent) => {
      let lastY, text = '';
      for (let item of textContent.items) {
        if (lastY === item.transform[4] || !lastY) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[4];
      }
      
      pages.push({
        pageNumber: pages.length + 1,
        text: text.trim(),
      });
      return text;
    });
  };

  const options = {
    pagerender: renderPage,
  };

  const parsed = await pdfParse(dataBuffer, options);

  return {
    text: parsed.text,
    numPages: parsed.numpages,
    info: parsed.info,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: parsed.text }],
  };
}

module.exports = { parsePdf };
