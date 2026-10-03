import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Set up worker for pdfjs-dist from CDN
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker setup warning:', err);
  }
}

export interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
  fileCategory: 'code' | 'document' | 'data' | 'image' | 'archive' | 'unknown';
  extractedFilesCount?: number;
  pageCount?: number;
}

/**
 * Extracts clean, readable text page-by-page from an uploaded PDF file
 * without producing raw binary streams (FlateDecode/ASCII dump).
 */
export async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    let fullText = `[PDF DOCUMENT: "${file.name}" - Total Pages: ${pageCount}]\n`;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageStrings = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      
      const pageText = pageStrings.join(' ');
      if (pageText.trim()) {
        fullText += `\n--- Page / Slide ${pageNum} of ${pageCount} ---\n${pageText}\n`;
      }
    }

    return { text: fullText, pageCount };
  } catch (err) {
    console.warn('PDF text extraction notice:', err);
    return {
      text: `[PDF Document: "${file.name}" (${formatBytes(file.size)})]`,
      pageCount: 1,
    };
  }
}

export async function processUploadedFile(file: File): Promise<ProcessedFile> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Determine file category
  const codeExts = ['py', 'js', 'ts', 'tsx', 'jsx', 'c', 'cpp', 'cc', 'h', 'hpp', 'java', 'rs', 'html', 'css', 'json', 'sql', 'sh', 'bash', 'yaml', 'yml', 'php', 'rb', 'go', 'swift', 'kt', 'tex'];
  const docExts = ['pdf', 'docx', 'doc', 'md', 'markdown', 'txt', 'rtf'];
  const dataExts = ['csv', 'tsv', 'xlsx', 'xls', 'xml'];
  const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'];
  const archiveExts = ['zip', 'tar', 'gz'];

  let fileCategory: ProcessedFile['fileCategory'] = 'unknown';
  if (codeExts.includes(extension)) fileCategory = 'code';
  else if (docExts.includes(extension)) fileCategory = 'document';
  else if (dataExts.includes(extension)) fileCategory = 'data';
  else if (imageExts.includes(extension) || file.type.startsWith('image/')) fileCategory = 'image';
  else if (archiveExts.includes(extension)) fileCategory = 'archive';

  // 1. PDF Documents: Extract clean page-by-page text AND retain base64Data with application/pdf
  if (extension === 'pdf' || file.type === 'application/pdf') {
    const [{ text, pageCount }, base64Data] = await Promise.all([
      extractTextFromPdf(file),
      readFileAsDataURL(file),
    ]);

    return {
      id,
      name: file.name,
      size: file.size,
      type: 'application/pdf',
      extension: 'pdf',
      textContent: text,
      base64Data,
      mimeType: 'application/pdf',
      fileCategory: 'document',
      pageCount,
    };
  }

  // 2. Images: Read as Data URL (base64)
  if (fileCategory === 'image') {
    const base64Data = await readFileAsDataURL(file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'image/png',
      extension,
      base64Data,
      mimeType: file.type || 'image/png',
      fileCategory,
    };
  }

  // 3. Archive (.zip): Unzip and extract all text/code files
  if (extension === 'zip') {
    try {
      const zip = await JSZip.loadAsync(file);
      let combinedText = `[ARCHIVE: ${file.name}]\n`;
      let count = 0;

      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const entryExt = filename.split('.').pop()?.toLowerCase() || '';
          if (codeExts.includes(entryExt) || docExts.includes(entryExt) || dataExts.includes(entryExt)) {
            const content = await zipEntry.async('text');
            combinedText += `\n--- File: ${filename} ---\n${content}\n`;
            count++;
          }
        }
      }

      return {
        id,
        name: file.name,
        size: file.size,
        type: 'application/zip',
        extension,
        textContent: combinedText,
        fileCategory: 'archive',
        extractedFilesCount: count,
      };
    } catch (zipErr) {
      console.warn('Failed to unzip archive:', zipErr);
      return {
        id,
        name: file.name,
        size: file.size,
        type: 'application/zip',
        extension,
        textContent: `[Archive ${file.name} - ${formatBytes(file.size)}]`,
        fileCategory: 'archive',
      };
    }
  }

  // 4. For code, text, markdown, csv, json, xml: Read as clean plain text
  try {
    const textContent = await readFileAsText(file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'text/plain',
      extension,
      textContent,
      fileCategory: fileCategory === 'unknown' ? 'document' : fileCategory,
    };
  } catch (err) {
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      extension,
      textContent: `[File payload: ${file.name} (${formatBytes(file.size)})]`,
      fileCategory: 'unknown',
    };
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Concatenates multiple academic PDF files into a unified, structured cross-document
 * curriculum context string ready for comprehensive Gemini analysis.
 */
export function buildConcatenatedPdfCurriculum(files: ProcessedFile[]): {
  concatenatedText: string;
  totalPdfCount: number;
  totalPagesCount: number;
  totalSizeBytes: number;
  fileNames: string[];
} {
  const pdfFiles = files.filter(
    (f) => f.extension === 'pdf' || f.mimeType === 'application/pdf' || f.type === 'application/pdf'
  );
  const totalPdfCount = pdfFiles.length;
  let totalPagesCount = 0;
  let totalSizeBytes = 0;
  const fileNames: string[] = [];

  let concatenated = `================================================================================
[CROSS-DOCUMENT ACADEMIC CURRICULUM SYNTHESIS: BATCH OF ${totalPdfCount} LECTURE DOCUMENTS]
================================================================================\n\n`;

  pdfFiles.forEach((file, index) => {
    const pages = file.pageCount || 1;
    totalPagesCount += pages;
    totalSizeBytes += file.size;
    fileNames.push(file.name);

    concatenated += `================================================================================
>>> [LECTURE DOCUMENT ${index + 1}/${totalPdfCount}: "${file.name}" - ${pages} Pages, ${formatBytes(file.size)}] <<<
================================================================================
${file.textContent || `[Document content for ${file.name}]`}

\n\n`;
  });

  return {
    concatenatedText: concatenated,
    totalPdfCount,
    totalPagesCount,
    totalSizeBytes,
    fileNames,
  };
}
