import { useEffect, useState } from 'react';
import { getAnalysis } from '../api.js';
import { fmtDate, Status } from './History.jsx';

const label = (k) =>
  k
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

function Section({ title, children, tone = '' }) {
  return (
    <section className={`report-section ${tone}`}>
      <div className="section-heading">
        <h2>{title}</h2>
      </div>

      {children}
    </section>
  );
}

function Empty() {
  return (
    <div className="report-empty">
      <span className="empty-check">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M6 12L10 16L18 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span>Nothing found in the document.</span>
    </div>
  );
}

function Confidence({ value }) {
  if (!value) return null;

  return (
    <span className={`confidence confidence-${value}`}>
      <span className="confidence-dot" />
      {value}
    </span>
  );
}

function Items({ items }) {
  if (!items?.length) return <Empty />;

  return (
    <ul className="report-items">
      {items.map((it, i) => (
        <li key={i}>
          <div className="item-content">
            <div className="item-top">
              <span
                className={`item-dot ${it.confidence || ''}`}
                title={`${it.confidence || 'unknown'} confidence`}
              />

              <span className="item-text">{it.text}</span>

              <Confidence value={it.confidence} />
            </div>

            {it.grounded === false && (
              <span className="verification-warning">
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
                    strokeWidth="1.7"
                  />
                </svg>
                Quote not found in source text
              </span>
            )}

            {it.source_quote && (
              <blockquote className="source-quote">
                <span className="quote-mark">“</span>
                <span>{it.source_quote}</span>
              </blockquote>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Plain({ items, empty }) {
  if (!items?.length) {
    return (
      <div className="report-empty">
        <span>{empty || 'None.'}</span>
      </div>
    );
  }

  return (
    <ul className="plain-list">
      {items.map((t, i) => (
        <li key={i}>
          <span className="plain-bullet" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Pairs({ data }) {
  const entries = Object.entries(data || {}).filter(
    ([, value]) => value
  );

  if (!entries.length) return <Empty />;

  return (
    <dl className="report-pairs">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt>{label(k)}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Meds({ items }) {
  if (!items?.length) return <Empty />;

  return (
    <div className="medication-table-wrapper">
      <table className="medication-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dose</th>
            <th>Route</th>
            <th>Frequency</th>
            <th>Confidence</th>
          </tr>
        </thead>

        <tbody>
          {items.map((m, i) => (
            <tr key={i}>
              <td>
                <strong>{m.name}</strong>
              </td>

              <td>{m.dose || '-'}</td>

              <td>{m.route || '-'}</td>

              <td>{m.frequency || '-'}</td>

              <td>
                <div className="med-confidence">
                  <Confidence value={m.confidence} />

                  {m.grounded === false && (
                    <span className="unverified-label">
                      Unverified
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportMeta({ analysis }) {
  return (
    <div className="report-meta">
      <div className="meta-item">
        <span className="meta-label">Processed</span>
        <span className="meta-value">
          {fmtDate(analysis.createdAt)}
        </span>
      </div>

      <div className="meta-divider" />

      <div className="meta-item">
        <span className="meta-label">Status</span>
        <Status s={analysis.status} />
      </div>

      {analysis.processingMs && (
        <>
          <div className="meta-divider" />

          <div className="meta-item">
            <span className="meta-label">Processing time</span>
            <span className="meta-value">
              {(analysis.processingMs / 1000).toFixed(1)}s
            </span>
          </div>
        </>
      )}

      <div className="meta-divider" />

      <div className="meta-item">
        <span className="meta-label">Source</span>
        <span className="meta-value source-type">
          {analysis.inputType}

          {analysis.extractionMethod === 'vision' && (
            <span className="vision-tag">Visual extraction</span>
          )}
        </span>
      </div>
    </div>
  );
}

export default function ReportView({ id, onBack }) {
  const [a, setA] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalysis(id)
      .then(setA)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <section className="report-page">
        <div className="report-error-state">
          <div className="report-error-icon">
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

          <h1>Unable to load report</h1>

          <p>{error}</p>

          <button className="secondary-button" onClick={onBack}>
            Back to past reports
          </button>
        </div>
      </section>
    );
  }

  if (!a) {
    return (
      <section className="report-page">
        <div className="report-loading">
          <div className="loading-spinner" />

          <div>
            <strong>Loading report</strong>
            <span>Retrieving the clinical review...</span>
          </div>
        </div>
      </section>
    );
  }

  const r = a.report;

  if (a.status !== 'completed' || !r) {
    return (
      <section className="report-page">
        <button className="back-button" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M11 18L5 12L11 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          Back to past reports
        </button>

        <div className="report-heading">
          <span className="eyebrow">Clinical review</span>
          <h1>Report unavailable</h1>

          <ReportMeta analysis={a} />
        </div>

        <div className="report-alert critical">
          <div className="alert-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8V12M12 16H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10.3 4.8L3.5 17C2.8 18.3 3.8 20 5.3 20H18.7C20.2 20 21.2 18.3 20.5 17L13.7 4.8C13 3.5 11 3.5 10.3 4.8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <strong>Analysis could not be completed</strong>
            <p>
              {a.error?.message ||
                'This document is still processing or failed.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="report-page">
      {/* Back */}
      <button className="back-button" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M11 18L5 12L11 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        Back to past reports
      </button>

      {/* Header */}
      <div className="report-heading">
        <div>
          <span className="eyebrow">Clinical review</span>

          <div className="report-title-row">
            <h1>Clinical review</h1>

            <span className="completed-badge">
              <span />
              Completed
            </span>
          </div>

          <p>
            Structured findings extracted from the submitted document.
          </p>
        </div>
      </div>

      <ReportMeta analysis={a} />

      {/* Document warnings */}
      {!r.readable && (
        <div className="report-alert critical" role="alert">
          <div className="alert-icon">
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
                strokeWidth="1.7"
              />
            </svg>
          </div>

          <div>
            <strong>Document could not be processed reliably</strong>

            <p>
              {r.unreadable_reason ||
                'The source document was not sufficiently readable.'}{' '}
              Try a clearer scan or paste the text directly.
            </p>
          </div>
        </div>
      )}

      {r.readable && r.document_quality === 'poor' && (
        <div className="report-alert warning" role="alert">
          <div className="alert-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8V12M12 16H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10.3 4.8L3.5 17C2.8 18.3 3.8 20 5.3 20H18.7C20.2 20 21.2 18.3 20.5 17L13.7 4.8C13 3.5 11 3.5 10.3 4.8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <strong>Document quality is poor</strong>
            <p>
              Check every extracted item against the original document.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="report-summary">
        <div className="summary-label">
          <span className="summary-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 4.5C6 3.67 6.67 3 7.5 3H16.5C17.33 3 18 3.67 18 4.5V20L12 17L6 20V4.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span>Report summary</span>
        </div>

        <p>{r.report_summary}</p>
      </div>

      {/* Attention required */}
      {(r.requires_review?.length > 0 ||
        r.potential_inconsistencies?.length > 0) && (
        <div className="attention-area">
          <div className="attention-header">
            <div className="attention-title">
              <span className="attention-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 8V12M12 16H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.3 4.8L3.5 17C2.8 18.3 3.8 20 5.3 20H18.7C20.2 20 21.2 18.3 20.5 17L13.7 4.8C13 3.5 11 3.5 10.3 4.8Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div>
                <strong>Attention required</strong>
                <span>Items that may need additional review</span>
              </div>
            </div>
          </div>

          {r.requires_review?.length > 0 && (
            <div className="attention-section">
              <h3>Needs review</h3>
              <Plain items={r.requires_review} />
            </div>
          )}

          {r.potential_inconsistencies?.length > 0 && (
            <div className="attention-section">
              <h3>Possible inconsistencies</h3>
              <Plain items={r.potential_inconsistencies} />
            </div>
          )}
        </div>
      )}

      {/* Structured report */}
      <div className="report-grid">
        <Section title="Patient information">
          <Pairs data={r.patient_information} />
        </Section>

        <Section title="Vital signs">
          <Pairs data={r.vitals} />
        </Section>
      </div>

      <Section title="Symptoms">
        <Items items={r.symptoms} />
      </Section>

      <Section title="Diagnoses and conditions">
        <Items items={r.diagnoses} />
      </Section>

      <Section title="Medications">
        <Meds items={r.medications} />
      </Section>

      <Section title="Allergies">
        <Items items={r.allergies} />
      </Section>

      <Section title="Clinical observations">
        <Items items={r.clinical_observations} />
      </Section>

      <Section title="Clinical concerns">
        <Plain items={r.clinical_concerns} />
      </Section>

      <Section title="Missing or incomplete information">
        <Plain
          items={r.missing_information}
          empty="Nothing flagged as missing."
        />
      </Section>

      {/* Disclaimer */}
      <div className="report-disclaimer">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3L19 6V11.5C19 16 16 20 12 21C8 20 5 16 5 11.5V6L12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M12 8V12M12 16H12.01"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>

        <p>
          This report is AI-generated from the submitted document and is
          intended for review assistance only. Verify findings against the
          original source and use appropriate clinical judgment.
        </p>
      </div>
    </section>
  );
}