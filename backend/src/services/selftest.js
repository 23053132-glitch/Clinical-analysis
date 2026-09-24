// Offline sanity check for schema validation + grounding (no API key or DB needed).
import { ReportSchema } from './schema.js';
import { groundReport } from './ground.js';
import { sniffType } from './extract.js';

const doc = 'Pt: Asha Rao, 58F. C/O chest pain x2 days. Allergy: penicillin. Rx amoxicillin 500mg TID. BP 150/95';
const raw = {
  readable: true,
  report_summary: 'Chest pain; penicillin allergy with amoxicillin prescribed.',
  patient_information: { name: 'Asha Rao', age: 58 },
  symptoms: [{ text: 'Chest pain', confidence: 'high', source_quote: 'chest pain x2 days' }],
  allergies: [{ text: 'Penicillin', confidence: 'high', source_quote: 'Allergy: penicillin' }],
  medications: [{ name: 'Amoxicillin', dose: '500mg', frequency: 'TID', source_quote: 'Rx amoxicillin 500mg TID' }],
  diagnoses: [{ text: 'Hypertension', confidence: 'high', source_quote: 'diagnosed hypertension' }],
  vitals: { blood_pressure: '150/95' },
};
const report = groundReport(ReportSchema.parse(raw), doc);
console.assert(report.patient_information.age === '58', 'age coerced to string');
console.assert(report.diagnoses[0].confidence === 'low', 'ungrounded quote downgraded');
console.assert(report.requires_review.length === 1, 'flagged for review');
console.assert(sniffType(Buffer.from('%PDF-1.7 abcdefgh')) === 'application/pdf', 'pdf sniff');
console.assert(sniffType(Buffer.from('hello world hello')) === null, 'text is not a file');
console.log('selftest ok');
