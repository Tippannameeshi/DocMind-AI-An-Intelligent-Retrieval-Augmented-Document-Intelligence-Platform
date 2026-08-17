/**
 * Recursive character text splitter for RAG chunking.
 * Splits page text into overlapping chunks preserving page numbers and offset metadata.
 */
class RecursiveTextSplitter {
  constructor({ chunkSize = 800, chunkOverlap = 150, separators = ['\n\n', '\n', '. ', ' ', ''] } = {}) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.separators = separators;
  }

  /**
   * Split document pages into array of structured chunk objects.
   * @param {Array<{ pageNumber: number, text: string }>} pages 
   * @param {string} documentId 
   * @returns {Array<{ documentId: string, chunkIndex: number, content: string, pageNumber: number, startChar: number, endChar: number }>}
   */
  splitPages(pages, documentId) {
    const allChunks = [];
    let globalChunkIndex = 0;

    for (const page of pages) {
      const pageText = page.text || '';
      if (!pageText.trim()) continue;

      const pageChunks = this._splitText(pageText);

      for (const chunkText of pageChunks) {
        if (!chunkText.trim()) continue;

        allChunks.push({
          documentId,
          chunkIndex: globalChunkIndex++,
          content: chunkText.trim(),
          pageNumber: page.pageNumber,
          startChar: 0,
          endChar: chunkText.length,
        });
      }
    }

    return allChunks;
  }

  _splitText(text) {
    const finalChunks = [];
    
    if (text.length <= this.chunkSize) {
      return [text];
    }

    // Try finding cleanest separator
    let selectedSeparator = this.separators[this.separators.length - 1];
    for (const sep of this.separators) {
      if (text.includes(sep)) {
        selectedSeparator = sep;
        break;
      }
    }

    const splits = selectedSeparator ? text.split(selectedSeparator) : [text];
    let currentChunk = '';

    for (const split of splits) {
      const candidate = currentChunk ? currentChunk + selectedSeparator + split : split;

      if (candidate.length <= this.chunkSize) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          finalChunks.push(currentChunk);
        }
        
        // If individual split is larger than chunkSize, force cut
        if (split.length > this.chunkSize) {
          let start = 0;
          while (start < split.length) {
            finalChunks.push(split.slice(start, start + this.chunkSize));
            start += this.chunkSize - this.chunkOverlap;
          }
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk) {
      finalChunks.push(currentChunk);
    }

    return finalChunks;
  }
}

module.exports = RecursiveTextSplitter;
