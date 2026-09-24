import { z } from 'zod';

// Lenient scalar: accepts string/number/null/undefined, always yields string|null.
const S = z.union([z.string(), z.number()]).transform(String).nullable().default(null);
const Conf = z.enum(['high', 'medium', 'low']).catch('medium');

const Item = z.object({
  text: z.string().min(1),
  confidence: Conf,
  source_quote: S,
});

const Medication = z.object({
  name: z.string().min(1),
  dose: S,
  route: S,
  frequency: S,
  confidence: Conf,
  source_quote: S,
});

const Strings = z.array(z.string()).default([]);

export const ReportSchema = z.object({
  readable: z.boolean(),
  unreadable_reason: S,
  document_quality: z.enum(['good', 'fair', 'poor']).catch('fair'),
  report_summary: z.string().min(1),
  patient_information: z
    .object({ name: S, age: S, sex: S, identifier: S, date_of_encounter: S })
    .default({}),
  symptoms: z.array(Item).default([]),
  diagnoses: z.array(Item).default([]),
  medications: z.array(Medication).default([]),
  vitals: z
    .object({
      blood_pressure: S,
      heart_rate: S,
      temperature: S,
      respiratory_rate: S,
      oxygen_saturation: S,
      weight: S,
      height: S,
    })
    .default({}),
  allergies: z.array(Item).default([]),
  clinical_observations: z.array(Item).default([]),
  clinical_concerns: Strings,
  missing_information: Strings,
  potential_inconsistencies: Strings,
  requires_review: Strings,
});

// Shown to the model as the exact shape to return.
export const JSON_TEMPLATE = `{
  "readable": true,
  "unreadable_reason": null,
  "document_quality": "good | fair | poor",
  "report_summary": "2-5 sentence overview for a quick reader",
  "patient_information": { "name": null, "age": null, "sex": null, "identifier": null, "date_of_encounter": null },
  "symptoms": [ { "text": "", "confidence": "high|medium|low", "source_quote": "exact words from the document" } ],
  "diagnoses": [ { "text": "", "confidence": "high|medium|low", "source_quote": "" } ],
  "medications": [ { "name": "", "dose": null, "route": null, "frequency": null, "confidence": "high|medium|low", "source_quote": "" } ],
  "vitals": { "blood_pressure": null, "heart_rate": null, "temperature": null, "respiratory_rate": null, "oxygen_saturation": null, "weight": null, "height": null },
  "allergies": [ { "text": "", "confidence": "high|medium|low", "source_quote": "" } ],
  "clinical_observations": [ { "text": "", "confidence": "high|medium|low", "source_quote": "" } ],
  "clinical_concerns": [ "" ],
  "missing_information": [ "" ],
  "potential_inconsistencies": [ "" ],
  "requires_review": [ "" ]
}`;
