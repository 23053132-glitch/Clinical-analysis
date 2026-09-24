import { useEffect, useState } from 'react';
import { listAnalyses } from '../api.js';

export const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const Status = ({ s }) => (
  <span className={`status status-${s}`}>
    <span className="status-dot" />
    {s}
  </span>
);

export default function History({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listAnalyses()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="history-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Review archive</span>
            <h1>Past reports</h1>
          </div>
        </div>

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

          <div>
            <strong>Unable to load reports</strong>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!items) {
    return (
      <section className="history-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Review archive</span>
            <h1>Past reports</h1>
            <p>Access previously generated clinical document reviews.</p>
          </div>
        </div>

        <div className="history-loading">
          <div className="loading-spinner" />
          <div>
            <strong>Loading reports</strong>
            <span>Fetching your review history...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="history-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Review archive</span>

          <div className="heading-row">
            <h1>Past reports</h1>

            <span className="report-count">
              {items.length} {items.length === 1 ? 'report' : 'reports'}
            </span>
          </div>

          <p>
            Access previously generated clinical document reviews.
          </p>
        </div>
      </div>

      {!items.length ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 4.5C6 3.67 6.67 3 7.5 3H16.5C17.33 3 18 3.67 18 4.5V20L12 17L6 20V4.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2>No reports yet</h2>

          <p>
            Your completed document reviews will appear here once you
            create your first review.
          </p>
        </div>
      ) : (
        <div className="history-card">
          <div className="history-header">
            <span>Review</span>
            <span>Status</span>
            <span>Document</span>
            <span />
          </div>

          <ul className="history">
            {items.map((a) => (
              <li key={a._id}>
                <button
                  className="history-item"
                  onClick={() => onOpen(a._id)}
                >
                  <div className="history-main">
                    <div className="history-title-row">
                      <span className="when">
                        {fmtDate(a.createdAt)}
                      </span>

                      <Status s={a.status} />
                    </div>

                    <p>
                      {a.reportSummary ||
                        a.error?.message ||
                        a.inputPreview ||
                        'No summary available.'}
                    </p>
                  </div>

                  <div className="history-document">
                    <span className="document-icon">
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
                          d="M10 11H15M10 14H15M10 17H13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>

                    <span>
                      {a.inputType}
                      {a.originalFilename && (
                        <small>{a.originalFilename}</small>
                      )}
                    </span>
                  </div>

                  <span className="history-arrow">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 6L15 12L9 18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}