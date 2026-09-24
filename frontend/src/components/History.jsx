import { useEffect, useState } from 'react';
import { listAnalyses } from '../api.js';

export const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
export const Status = ({ s }) => <span className={`status ${s}`}>{s}</span>;

export default function History({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listAnalyses().then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="banner error" role="alert">{error}</div>;
  if (!items) return <p className="muted"><span className="spinner" /> Loading past reports...</p>;
  if (!items.length) return <p className="muted">No reports yet. Start with a new review.</p>;

  return (
    <section>
      <h1>Past reports</h1>
      <ul className="history">
        {items.map((a) => (
          <li key={a._id}>
            <button onClick={() => onOpen(a._id)}>
              <div className="row">
                <span className="when">{fmtDate(a.createdAt)}</span>
                <Status s={a.status} />
                <span className="kind">{a.inputType}{a.originalFilename ? `: ${a.originalFilename}` : ''}</span>
              </div>
              <p>{a.reportSummary || a.error?.message || a.inputPreview || 'No summary available.'}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
