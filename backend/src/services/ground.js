// Cheap hallucination check: every extracted item carries a verbatim quote.
// If the quote is not actually in the document text, downgrade it and flag it for review.
const norm = (s) =>
  String(s).toLowerCase().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

export function groundReport(report, sourceText) {
  if (!sourceText) return report; // image / scanned PDF: no text layer to compare against
  const haystack = norm(sourceText);
  const flagged = [];

  const check = (item, label, name) => {
    if (!item.source_quote) {
      if (item.confidence === 'high') item.confidence = 'medium';
      return;
    }
    if (haystack.includes(norm(item.source_quote))) {
      item.grounded = true;
    } else {
      item.grounded = false;
      item.confidence = 'low';
      flagged.push(`${label} "${name}" could not be matched to the document text. Verify it.`);
    }
  };

  report.symptoms.forEach((i) => check(i, 'Symptom', i.text));
  report.diagnoses.forEach((i) => check(i, 'Diagnosis', i.text));
  report.allergies.forEach((i) => check(i, 'Allergy', i.text));
  report.clinical_observations.forEach((i) => check(i, 'Observation', i.text));
  report.medications.forEach((i) => check(i, 'Medication', i.name));

  report.requires_review.push(...flagged.slice(0, 6));
  return report;
}
