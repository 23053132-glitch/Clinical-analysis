import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing', index: true },
    inputType: { type: String, enum: ['text', 'image', 'pdf'], required: true },
    originalFilename: String,
    inputPreview: String, // first characters of text input, for the history list
    extractionMethod: { type: String, enum: ['plain-text', 'pdf-text', 'vision'] },
    reportSummary: String, // duplicated out of `report` so the list view stays light
    report: mongoose.Schema.Types.Mixed,
    error: { code: String, message: String },
    processingMs: Number,
  },
  { timestamps: true }
);

export const Analysis = mongoose.model('Analysis', analysisSchema);
