import pdfParse from 'pdf-parse/lib/pdf-parse.js'; // direct path avoids pdf-parse's debug-mode index.js bug
import { AppError } from '../middleware/errors.js';
import { config } from '../config.js';

// Detect the real file type from magic bytes instead of trusting the client's mimetype.
export function sniffType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
    return 'image/webp';
  return null;
}

async function extractPdf(buffer, filename) {
  let text = '';
  let pages = null;
  try {
    const parsed = await pdfParse(buffer);
    text = (parsed.text || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    pages = parsed.numpages;
  } catch (err) {
    console.warn('pdf-parse failed, falling back to vision:', err.message);
  }

  if (text.length >= config.minPdfTextChars) {
    return { inputType: 'pdf', method: 'pdf-text', sourceText: text, media: null, filename, pages };
  }
  // Scanned or unparsable PDF: let the multimodal model read the pages directly.
  return {
    inputType: 'pdf',
    method: 'vision',
    sourceText: null,
    media: { mimeType: 'application/pdf', data: buffer.toString('base64') },
    filename,
    pages,
  };
}

export async function extractInput({ text, file }) {
  if (file) {
    const mime = sniffType(file.buffer);
    if (!mime) {
      throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Unsupported or corrupted file. Upload a PDF, PNG, JPG or WebP.');
    }
    if (mime === 'application/pdf') return extractPdf(file.buffer, file.originalname);
    return {
      inputType: 'image',
      method: 'vision',
      sourceText: null,
      media: { mimeType: mime, data: file.buffer.toString('base64') },
      filename: file.originalname,
    };
  }
  return { inputType: 'text', method: 'plain-text', sourceText: text, media: null };
}
