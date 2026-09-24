import { Router } from 'express';
import mongoose from 'mongoose';
import { upload } from '../middleware/upload.js';
import { AppError } from '../middleware/errors.js';
import { Analysis } from '../models/Analysis.js';
import { extractInput } from '../services/extract.js';
import { analyzeDocument } from '../services/gemini.js';
import { config } from '../config.js';

const router = Router();

// Create: multipart form with either `text` or `file`
router.post('/', upload.single('file'), async (req, res, next) => {
  const started = Date.now();
  let doc = null;
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const file = req.file;

    if (!text && !file) throw new AppError(400, 'EMPTY_INPUT', 'Enter clinical notes or upload a file.');
    if (text && file) throw new AppError(400, 'AMBIGUOUS_INPUT', 'Send either text or a file, not both.');
    if (text.length > config.maxTextChars)
      throw new AppError(400, 'TEXT_TOO_LONG', `Text is too long. The limit is ${config.maxTextChars} characters.`);

    const extracted = await extractInput({ text, file });

    doc = await Analysis.create({
      status: 'processing',
      inputType: extracted.inputType,
      originalFilename: extracted.filename,
      inputPreview: extracted.sourceText ? extracted.sourceText.slice(0, 200) : undefined,
      extractionMethod: extracted.method,
    });

    const report = await analyzeDocument(extracted);

    doc.report = report;
    doc.reportSummary = report.report_summary;
    doc.status = 'completed';
    doc.processingMs = Date.now() - started;
    await doc.save();

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (doc) {
      doc.status = 'failed';
      doc.error = { code: err.code || 'INTERNAL_ERROR', message: err.message };
      doc.processingMs = Date.now() - started;
      await doc.save().catch(() => {});
      err.analysisId = doc._id;
    }
    next(err);
  }
});

// List (no full report, keeps the payload small)
router.get('/', async (_req, res, next) => {
  try {
    const items = await Analysis.find().sort({ createdAt: -1 }).limit(100).select('-report').lean();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// Read one
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, 'NOT_FOUND', 'Report not found.');
    const doc = await Analysis.findById(req.params.id).lean();
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Report not found.');
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
