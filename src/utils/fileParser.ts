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

export type FileCategory =
  | 'code'
  | 'document'
  | 'data'
  | 'image'
  | 'audio'
  | 'video'
  | 'archive'
  | 'unknown';

export interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  textContent?: string;
  base64Data?: string;
  mimeType: string;
  fileCategory: FileCategory;
  extractedFilesCount?: number;
  pageCount?: number;
}

/**
 * Universal accept attribute supporting all requested extensions:
 * Documents: .pdf, .doc, .docx, .txt, .rtf, .odt, .csv, .tsv, .xls, .xlsx, .ppt, .pptx
 * Code & Web: .html, .htm, .css, .js, .jsx, .ts, .tsx, .py, .java, .c, .cpp, .cs, .php, .rb, .go, .rs, .swift, .kt, .sql, .json, .xml, .yaml, .yml, .md, .sh
 * Images: .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg, .ico, .tiff
 * Audio & Voice: .mp3, .wav, .m4a, .ogg, .aac, .flac, .webm
 * Videos: .mp4, .mkv, .mov, .avi, .webm, .wmv, .flv
 */
export const SUPPORTED_ACCEPT_ATTRIBUTE = [
  // Documents
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.csv', '.tsv', '.xls', '.xlsx', '.ppt', '.pptx',
  // Code & Web
  '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cc', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql', '.json', '.xml', '.yaml', '.yml', '.md', '.sh',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', 'image/*',
  // Audio & Voice Recordings
  '.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', 'audio/*',
  // Videos
  '.mp4', '.mkv', '.mov', '.avi', '.webm', '.wmv', '.flv', 'video/*',
  // Archives
  '.zip', '.tar', '.gz',
].join(',');

/**
 * Resolves standard IANA MIME types for all supported extensions.
 */
export function getMimeType(fileName: string, browserMimeType?: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Use browser MIME type if valid, specific, and matches general family
  if (
    browserMimeType &&
    browserMimeType !== 'application/octet-stream' &&
    browserMimeType.includes('/') &&
    !browserMimeType.endsWith('unknown')
  ) {
    return browserMimeType;
  }

  switch (ext) {
    // Documents
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt': return 'text/plain';
    case 'rtf': return 'application/rtf';
    case 'odt': return 'application/vnd.oasis.opendocument.text';
    case 'csv': return 'text/csv';
    case 'tsv': return 'text/tab-separated-values';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

    // Code & Web
    case 'html':
    case 'htm': return 'text/html';
    case 'css': return 'text/css';
    case 'js': return 'text/javascript';
    case 'jsx': return 'text/jsx';
    case 'ts': return 'text/typescript';
    case 'tsx': return 'text/tsx';
    case 'py': return 'text/x-python';
    case 'java': return 'text/x-java-source';
    case 'c': return 'text/x-c';
    case 'cpp':
    case 'cc': return 'text/x-c++';
    case 'cs': return 'text/x-csharp';
    case 'php': return 'text/x-php';
    case 'rb': return 'text/x-ruby';
    case 'go': return 'text/x-go';
    case 'rs': return 'text/x-rust';
    case 'swift': return 'text/x-swift';
    case 'kt': return 'text/x-kotlin';
    case 'sql': return 'application/sql';
    case 'json': return 'application/json';
    case 'xml': return 'application/xml';
    case 'yaml':
    case 'yml': return 'text/yaml';
    case 'md': return 'text/markdown';
    case 'sh': return 'application/x-sh';

    // Images
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'bmp': return 'image/bmp';
    case 'svg': return 'image/svg+xml';
    case 'ico': return 'image/x-icon';
    case 'tiff': return 'image/tiff';

    // Audio & Voice Recordings
    case 'mp3': return 'audio/mp3';
    case 'wav': return 'audio/wav';
    case 'm4a': return 'audio/m4a';
    case 'ogg': return 'audio/ogg';
    case 'aac': return 'audio/aac';
    case 'flac': return 'audio/flac';

    // Videos
    case 'mp4': return 'video/mp4';
    case 'mkv': return 'video/x-matroska';
    case 'mov': return 'video/quicktime';
    case 'avi': return 'video/x-msvideo';
    case 'wmv': return 'video/x-ms-wmv';
    case 'flv': return 'video/x-flv';
    case 'webm':
      return browserMimeType?.startsWith('audio') ? 'audio/webm' : 'video/webm';

    // Archives
    case 'zip': return 'application/zip';
    case 'tar': return 'application/x-tar';
    case 'gz': return 'application/gzip';

    default:
      return browserMimeType || 'application/octet-stream';
  }
}

/**
 * Extracts clean, readable text page-by-page from an uploaded PDF file
 * without producing raw binary streams.
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

/**
 * Tries to extract readable text from Office OpenXML documents (docx, pptx, xlsx)
 * via embedded xml inspection using JSZip.
 */
async function tryExtractOfficeText(file: File): Promise<string | undefined> {
  try {
    const zip = await JSZip.loadAsync(file);
    const textPieces: string[] = [];

    // Word docx: word/document.xml
    const wordDoc = zip.file('word/document.xml');
    if (wordDoc) {
      const xml = await wordDoc.async('text');
      const extracted = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (extracted) textPieces.push(extracted);
    }

    // PowerPoint pptx: ppt/slides/slide*.xml
    const slideFiles = Object.keys(zip.files).filter((k) => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'));
    for (const slidePath of slideFiles) {
      const slide = zip.file(slidePath);
      if (slide) {
        const xml = await slide.async('text');
        const extracted = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (extracted) textPieces.push(extracted);
      }
    }

    // Excel xlsx: xl/sharedStrings.xml
    const sharedStrings = zip.file('xl/sharedStrings.xml');
    if (sharedStrings) {
      const xml = await sharedStrings.async('text');
      const extracted = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (extracted) textPieces.push(extracted);
    }

    if (textPieces.length > 0) {
      return textPieces.join('\n\n');
    }
  } catch {
    // If not a zip or fails, fallback safely
  }
  return undefined;
}

/**
 * Unified file processor for Documents, Code, Images, Audio, Video, and Archives.
 */
export async function processUploadedFile(file: File): Promise<ProcessedFile> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const mimeType = getMimeType(file.name, file.type);

  // Groupings
  const codeExts = [
    'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cc',
    'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'sql', 'json', 'xml', 'yaml', 'yml', 'md', 'sh',
  ];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'ppt', 'pptx'];
  const dataExts = ['csv', 'tsv', 'xls', 'xlsx'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'];
  const audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'];
  const videoExts = ['mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv'];
  const archiveExts = ['zip', 'tar', 'gz'];

  let fileCategory: FileCategory = 'unknown';

  if (codeExts.includes(extension)) fileCategory = 'code';
  else if (dataExts.includes(extension)) fileCategory = 'data';
  else if (docExts.includes(extension)) fileCategory = 'document';
  else if (imageExts.includes(extension) || mimeType.startsWith('image/')) fileCategory = 'image';
  else if (audioExts.includes(extension) || mimeType.startsWith('audio/')) fileCategory = 'audio';
  else if (videoExts.includes(extension) || mimeType.startsWith('video/')) fileCategory = 'video';
  else if (archiveExts.includes(extension) || mimeType.includes('zip') || mimeType.includes('tar')) fileCategory = 'archive';
  else if (extension === 'webm') {
    fileCategory = mimeType.startsWith('audio') ? 'audio' : 'video';
  }

  // 1. PDF Documents: Extract text + Base64
  if (extension === 'pdf' || mimeType === 'application/pdf') {
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

  // 2. Images: Read as Data URL with exact image MIME type
  if (fileCategory === 'image') {
    const base64Data = await readFileAsDataURL(file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: mimeType,
      extension,
      base64Data,
      mimeType,
      fileCategory: 'image',
    };
  }

  // 3. Audio & Voice Recordings: Read as Data URL with exact audio MIME type
  if (fileCategory === 'audio') {
    const base64Data = await readFileAsDataURL(file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: mimeType,
      extension,
      base64Data,
      mimeType,
      fileCategory: 'audio',
      textContent: `[Audio Recording: "${file.name}" (${formatBytes(file.size)})]`,
    };
  }

  // 4. Videos: Read as Data URL with exact video MIME type
  if (fileCategory === 'video') {
    const base64Data = await readFileAsDataURL(file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: mimeType,
      extension,
      base64Data,
      mimeType,
      fileCategory: 'video',
      textContent: `[Video Media: "${file.name}" (${formatBytes(file.size)})]`,
    };
  }

  // 5. Code & Plain Text Files (read as raw UTF-8 text + base64)
  const isPureTextOrCode =
    fileCategory === 'code' ||
    ['txt', 'csv', 'tsv', 'md', 'json', 'xml', 'yaml', 'yml', 'rtf'].includes(extension);

  if (isPureTextOrCode) {
    try {
      const [textContent, base64Data] = await Promise.all([
        readFileAsText(file),
        readFileAsDataURL(file),
      ]);
      return {
        id,
        name: file.name,
        size: file.size,
        type: mimeType,
        extension,
        textContent,
        base64Data,
        mimeType,
        fileCategory: fileCategory === 'unknown' ? 'document' : fileCategory,
      };
    } catch (err) {
      console.warn(`Failed to read text for ${file.name}:`, err);
    }
  }

  // 6. Office Documents (.docx, .doc, .pptx, .ppt, .xlsx, .xls, .odt):
  // Read binary Base64 + attempt xml text extraction
  if (['docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls', 'odt'].includes(extension)) {
    const [base64Data, officeText] = await Promise.all([
      readFileAsDataURL(file),
      tryExtractOfficeText(file),
    ]);

    return {
      id,
      name: file.name,
      size: file.size,
      type: mimeType,
      extension,
      textContent: officeText || `[Office Document: "${file.name}" (${formatBytes(file.size)})]`,
      base64Data,
      mimeType,
      fileCategory: ['xls', 'xlsx'].includes(extension) ? 'data' : 'document',
    };
  }

  // 7. Archive (.zip): Extract text/code files
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

      const base64Data = await readFileAsDataURL(file);

      return {
        id,
        name: file.name,
        size: file.size,
        type: 'application/zip',
        extension,
        textContent: combinedText,
        base64Data,
        mimeType: 'application/zip',
        fileCategory: 'archive',
        extractedFilesCount: count,
      };
    } catch (zipErr) {
      console.warn('Failed to unzip archive:', zipErr);
    }
  }

  // Fallback for any other file type: read both as text (if possible) and Base64 data
  try {
    const [textContent, base64Data] = await Promise.all([
      readFileAsText(file).catch(() => undefined),
      readFileAsDataURL(file),
    ]);
    return {
      id,
      name: file.name,
      size: file.size,
      type: mimeType,
      extension,
      textContent: textContent || `[File: ${file.name} (${formatBytes(file.size)})]`,
      base64Data,
      mimeType,
      fileCategory: fileCategory || 'document',
    };
  } catch {
    return {
      id,
      name: file.name,
      size: file.size,
      type: mimeType,
      extension,
      textContent: `[File payload: ${file.name} (${formatBytes(file.size)})]`,
      mimeType,
      fileCategory: 'unknown',
    };
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'UTF-8');
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
