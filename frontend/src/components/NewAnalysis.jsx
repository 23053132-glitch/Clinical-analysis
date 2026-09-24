import { useRef, useState } from 'react';
import { createAnalysis } from '../api.js';
import { SAMPLE_NOTE } from '../sample.js';

const MAX_MB = 10;

const TABS = [
  {
    id: 'text',
    label: 'Type or paste',
    description: 'Clinical notes',
  },
  {
    id: 'image',
    label: 'Image',
    description: 'PNG, JPG or WebP',
    accept: 'image/png,image/jpeg,image/webp',
    types: ['image/png', 'image/jpeg', 'image/webp'],
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'PDF documents',
    accept: 'application/pdf',
    types: ['application/pdf'],
  },
];

export default function NewAnalysis({ onDone, onFailed }) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const current = TABS.find((t) => t.id === tab);

  function pickTab(id) {
    setTab(id);
    setFile(null);
    setError('');
  }

  function validateFile(f) {
    if (!f) {
      setFile(null);
      return;
    }

    setError('');

    if (!current.types.includes(f.type)) {
      setFile(null);

      return setError(
        tab === 'pdf'
          ? 'That file is not a PDF. Please choose a .pdf file.'
          : 'Unsupported image format. Please use PNG, JPG or WebP.'
      );
    }

    if (f.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      return setError(`File is larger than ${MAX_MB} MB.`);
    }

    setFile(f);
  }

  function pickFile(e) {
    validateFile(e.target.files?.[0]);
  }

  function handleDrop(e) {
    e.preventDefault();

    if (busy) return;

    const droppedFile = e.dataTransfer.files?.[0];

    validateFile(droppedFile);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function removeFile() {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function submit(e) {
    e.preventDefault();

    setError('');

    if (tab === 'text' && !text.trim()) {
      return setError('Enter some clinical notes first.');
    }

    if (tab !== 'text' && !file) {
      return setError('Choose a file first.');
    }

    setBusy(true);

    try {
      const analysis = await createAnalysis(
        tab === 'text' ? { text } : { file }
      );

      onDone(analysis);
    } catch (err) {
      setError(err.message);
      onFailed?.(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="new-analysis">
      {/* Header */}
      <div className="analysis-header">
        <div>
          <span className="eyebrow">Clinical review</span>

          <h1>Review a clinical document</h1>

          <p className="lede">
            Submit clinical notes, a document image, or a PDF. The reviewer
            generates a concise summary and structured findings while
            highlighting information that may need attention.
          </p>
        </div>

        <div className="secure-badge">
          <span className="secure-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3L19 6V11.5C19 16 16 20 12 21C8 20 5 16 5 11.5V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span>
            <strong>Demo environment</strong>
            <small>Synthetic data only</small>
          </span>
        </div>
      </div>

      {/* Input card */}
      <div className="analysis-card">
        <div className="analysis-card-header">
          <div>
            <span className="step-label">STEP 01</span>
            <h2>Provide your document</h2>
          </div>

          <span className="format-limit">
            Maximum file size: {MAX_MB} MB
          </span>
        </div>

        {/* Tabs */}
        <div className="analysis-tabs" role="tablist" aria-label="Input type">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`analysis-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => pickTab(t.id)}
              disabled={busy}
            >
              <span className="tab-icon">
                {t.id === 'text' && (
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 6H19M5 10H19M5 14H15M5 18H12"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {t.id === 'image' && (
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <circle
                      cx="9"
                      cy="9"
                      r="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M4 16L8.5 12L11.5 15L14 12.5L20 18"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {t.id === 'pdf' && (
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 3.5H14L18 7.5V20.5H7V3.5Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 3.5V7.5H18"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 12H15M9.5 15H15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>

              <span className="tab-copy">
                <strong>{t.label}</strong>
                <small>{t.description}</small>
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {tab === 'text' ? (
            <div className="text-input-section">
              <div className="field-header">
                <label htmlFor="note">Clinical notes</label>

                <span className="character-count">
                  {text.length.toLocaleString()} characters
                </span>
              </div>

              <div className="textarea-wrapper">
                <textarea
                  id="note"
                  rows={14}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    'Paste or type the clinical note here...\n\nExample: patient history, observations, medications, examination findings, assessment, or plan.'
                  }
                  disabled={busy}
                />

                <div className="textarea-footer">
                  <span>
                    Your text will be processed to generate the review.
                  </span>

                  <button
                    type="button"
                    className="sample-button"
                    onClick={() => setText(SAMPLE_NOTE)}
                    disabled={busy}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 5H19V19H5V5Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 9H16M8 12H16M8 15H13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Use sample note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="file-section">
              <label htmlFor="file" className="file-label">
                {tab === 'pdf' ? 'PDF document' : 'Document image'}
              </label>

              {!file ? (
                <div
                  className="dropzone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 15V4M12 4L8 8M12 4L16 8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 14V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <strong>
                    Drop your {tab === 'pdf' ? 'PDF' : 'image'} here
                  </strong>

                  <span>
                    or <em>browse from your computer</em>
                  </span>

                  <small>
                    {tab === 'pdf'
                      ? 'PDF documents up to 10 MB'
                      : 'PNG, JPG or WebP up to 10 MB'}
                  </small>

                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept={current.accept}
                    onChange={pickFile}
                    disabled={busy}
                    hidden
                  />
                </div>
              ) : (
                <div className="selected-file">
                  <div className="selected-file-icon">
                    {tab === 'pdf' ? (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M7 3.5H14L18 7.5V20.5H7V3.5Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 3.5V7.5H18"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect
                          x="4"
                          y="4"
                          width="16"
                          height="16"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle
                          cx="9"
                          cy="9"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M4 16L8.5 12L11.5 15L14 12.5L20 18"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="selected-file-info">
                    <strong>{file.name}</strong>
                    <span>
                      {tab === 'pdf' ? 'PDF document' : 'Image'} ·{' '}
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  <button
                    type="button"
                    className="remove-file"
                    onClick={removeFile}
                    disabled={busy}
                    aria-label="Remove selected file"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6L18 18M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <p className="file-hint">
                Typed, scanned and handwritten documents are supported.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="banner error" role="alert">
              <div className="banner-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 8V12M12 16H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>

              <span>{error}</span>
            </div>
          )}

          {/* Processing */}
          {busy && (
            <div className="processing-banner" role="status">
              <div className="processing-animation">
                <span />
                <span />
                <span />
              </div>

              <div>
                <strong>Analyzing document</strong>
                <p>
                  Reading the document and building your report. This
                  usually takes 10–30 seconds.
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="submit-area">
            <div className="submit-note">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3L19 6V11.5C19 16 16 20 12 21C8 20 5 16 5 11.5V6L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>
                AI-generated output should always be reviewed by a clinician.
              </span>
            </div>

            <button
              className="primary analyze-button"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="button-spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze document

                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12H19M13 6L19 12L13 18"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Workflow explanation */}
      <div className="workflow">
        <div className="workflow-item">
          <span className="workflow-number">01</span>
          <div>
            <strong>Submit</strong>
            <span>Provide your clinical document</span>
          </div>
        </div>

        <div className="workflow-line" />

        <div className="workflow-item">
          <span className="workflow-number">02</span>
          <div>
            <strong>Analyze</strong>
            <span>AI reviews the submitted content</span>
          </div>
        </div>

        <div className="workflow-line" />

        <div className="workflow-item">
          <span className="workflow-number">03</span>
          <div>
            <strong>Review</strong>
            <span>Inspect the structured findings</span>
          </div>
        </div>
      </div>
    </section>
  );
}