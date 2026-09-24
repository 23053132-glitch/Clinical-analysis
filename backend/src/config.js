import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  geminiKey: process.env.OLLAMA_API_KEY,
  geminiModel: process.env.OLLAMA_MODEL || 'gpt-oss:120b',
  ollamaUrl: process.env.OLLAMA_URL || 'https://ollama.com',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  maxFileBytes: 10 * 1024 * 1024,
  maxTextChars: 20000,
  minPdfTextChars: 100, // below this a PDF is treated as scanned
  aiTimeoutMs: 90000,
};