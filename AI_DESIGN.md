# AI/ML Design

## 1. Models and services

- **Google Gemini** (`gemini-2.5-flash` by default, configurable) through the `@google/genai` SDK. One model handles typed text, photographed pages, handwriting and scanned PDFs, so there is no separate OCR service to run or maintain.
- **pdf-parse** extracts the text layer from typed PDFs.
- **Zod** validates the model's JSON. A verbatim-quote grounding check runs after validation.

## 2. How a submitted document is processed

1. **Validate**: reject empty input, text over 20,000 characters, both text and file together, and files over 10 MB.
2. **Sniff the file type** from magic bytes (PDF, PNG, JPEG, WebP), not from the client's mimetype. Anything else is rejected as unsupported or corrupted.
3. **Extract**:
   - Text: used as is.
   - PDF: parse with pdf-parse. If at least 100 characters come back, use that text. If not (scanned PDF) or if parsing throws, send the PDF itself to the model.
   - Image: send to the model as an inline image.
4. **Persist** a record with status `processing`, then analyze, then update it to `completed` or `failed`.

## 3. How information is extracted and passed to the model

Text inputs are wrapped in delimiters and sent as data. Image and scanned-PDF inputs are sent as inline files. The system prompt tells the model to extract only what is written, to attach a verbatim `source_quote` and a confidence level to each item, and to treat the document as data and ignore any instructions inside it.

## 4. How the report and structured output are produced

A single call returns JSON (`responseMimeType: application/json`, temperature 0) matching a template embedded in the prompt. The template includes `report_summary`, patient information, symptoms, diagnoses, medications, vitals, allergies, observations, concerns, missing information, potential inconsistencies and items requiring review. One call keeps the summary consistent with the detail. The model is told to write the summary as 2 to 5 sentences covering concerns, findings, diagnoses, medications, vitals, gaps and items to check.

## 5. Missing or uncertain information

- Unstated fields are `null` and are listed in `missing_information`. The model is told never to guess.
- Each item has `confidence` (high, medium, low). Illegible or ambiguous content must be `low`.
- Non-clinical, empty or illegible documents return `readable: false` with a reason. The UI shows a clear banner instead of a report that looks trustworthy.
- `document_quality` (good, fair, poor) triggers a warning banner for poor documents.

## 6. Reducing incorrect or unsupported information

- **Grounding by quotation**: every extracted item must include the exact words that support it. For inputs with a text layer, the server normalizes case, whitespace and punctuation and checks that the quote appears in the source. If not, the item is set to low confidence, marked `grounded: false`, and added to "needs review". Items with no quote cannot stay at high confidence.
- **Constrained role**: the prompt forbids diagnosing or advising and limits the model to summarizing and flagging.
- **Inconsistency detection** is an explicit instruction (allergy versus prescribed drug, contradictory values, diagnosis without support), so conflicts surface for a human.
- **Injection resistance**: document text is treated as data.
- The UI shows the source quote next to each item so a reviewer can verify quickly.

## 7. Failures and malformed output

| Situation | Behaviour |
|---|---|
| Model returns invalid JSON or breaks the schema | One retry with the validation error included; then 502 `INVALID_MODEL_OUTPUT` and the record is saved as `failed` |
| Small schema deviations (numbers instead of strings, unknown confidence) | Coerced by the schema instead of failing |
| Timeout (90 s) | 504 `AI_TIMEOUT` |
| Rate limit from the AI service | 503 `AI_RATE_LIMITED` |
| Corrupted or unsupported file | 415 from magic-byte check, or 422 `UNREADABLE_DOCUMENT` if the AI service rejects it |
| Bad credentials or missing key | Clear server-side error code; no key is ever sent to the browser |
| Database or unexpected error | Central error handler returns the standard error shape |

The frontend also handles network failure and cold-start timeouts with readable messages.

## 8. Technical decisions and trade-offs

- **React + Vite**: fast to build and deploy as a static site, and a good fit for a form plus report views. No router was needed for three screens.
- **Express**: a small, explicit REST API with a clean separation between routes, services and models. The frontend contains no AI logic.
- **MongoDB**: the report is a nested JSON document that changes shape as the schema evolves, so a document store avoids migrations. Atlas has a free tier.
- **Multimodal LLM instead of OCR + rules**: handwriting and messy scans are handled far better by a vision-capable model than by classic OCR, and it cut build time. The trade-off is less determinism and an external dependency, which is why schema validation, grounding and retries exist.
- **pdf-parse first, model second**: cheaper and more faithful for typed PDFs, and it gives us a text layer for the grounding check.
- **Synchronous processing**: simplest reliable flow for the assignment. A job queue with polling would be better for long documents.
- **No authentication**: out of scope and only acceptable with synthetic data.

## 9. Weaknesses and future improvements

- Move to async jobs with a queue and progress updates.
- Add an evaluation set of labelled synthetic notes and measure extraction accuracy, hallucination rate and inconsistency recall.
- Add a bounding-box or page reference for image sources so reviewers can see where each item came from.
- Add a second-pass verification prompt for high-risk fields (allergies, doses).
- Add authentication, per-user history, rate limiting, audit logs and encryption for any real PHI workflow, plus compliance review.
- Add drug-interaction and allergy-class checks from a curated database instead of relying on the model alone.
