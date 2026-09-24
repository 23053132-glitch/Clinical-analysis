import { useEffect, useState } from 'react';
import { getAnalysis } from '../api.js';
import { fmtDate, Status } from './History.jsx';

const label = (k) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function Section({ title, children, tone }) {
  return (
    <section className={`sec ${tone || ''}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="muted">Nothing found in the document.</p>;
}

function Items({ items }) {
  if (!items?.length) return <Empty />;
  return (
    <ul className="items">
      {items.map((it, i) => (
        <li key={i}>
          <div>
            <span className={`dot ${it.confidence}`} title={`${it.confidence} confidence`} />
            {it.text}
            <span className="conf">{it.confidence} confidence</span>
            {it.grounded === false && <span className="conf warn">quote not found in text</span>}
          </div>
          {it.source_quote && <blockquote>{it.source_quote}</blockquote>}
        </li>
      ))}
    </ul>
  );
}

function Plain({ items, empty }) {
  if (!items?.length) return <p className="muted">{empty || 'None.'}</p>;
  return <ul className="plain">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
}

function Pairs({ data }) {
  const entries = Object.entries(data || {}).filter(([, v]) => v);
  if (!entries.length) return <Empty />;
  return (
    <dl className="pairs">
      {entries.map(([k, v]) => (
        <div key={k}><dt>{label(k)}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

function Meds({ items }) {
  if (!items?.length) return <Empty />;
  return (
    <div className="scroll">
      <table>
        <thead><tr><th>Medication</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Confidence</th></tr></thead>
        <tbody>
          {items.map((m, i) => (
            <tr key={i}>
              <td>{m.name}</td><td>{m.dose || '-'}</td><td>{m.route || '-'}</td><td>{m.frequency || '-'}</td>
              <td><span className={`dot ${m.confidence}`} /> {m.confidence}{m.grounded === false ? ' (unverified)' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportView({ id, onBack }) {
  const [a, setA] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalysis(id).then(setA).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="banner error" role="alert">{error}</div>;
  if (!a) return <p className="muted"><span className="spinner" /> Loading report...</p>;

  const r = a.report;
  const meta = (
    <p className="meta">
      Processed {fmtDate(a.createdAt)} <Status s={a.status} />
      {a.processingMs ? ` in ${(a.processingMs / 1000).toFixed(1)}s` : ''} from {a.inputType}
      {a.extractionMethod === 'vision' ? ' (read visually)' : ''}
    </p>
  );

  if (a.status !== 'completed' || !r) {
    return (
      <section>
        <button className="link" onClick={onBack}>Back to past reports</button>
        <h1>Report unavailable</h1>
        {meta}
        <div className="banner error" role="alert">{a.error?.message || 'This document is still processing or failed.'}</div>
      </section>
    );
  }

  return (
    <section className="report">
      <button className="link" onClick={onBack}>Back to past reports</button>
      <h1>Clinical review</h1>
      {meta}

      {!r.readable && (
        <div className="banner error" role="alert">
          This document could not be processed reliably. {r.unreadable_reason || ''} Try a clearer scan or paste the text.
        </div>
      )}
      {r.readable && r.document_quality === 'poor' && (
        <div className="banner warn">Document quality is poor. Check every item against the original.</div>
      )}

      <div className="summary">
        <h2>Report summary</h2>
        <p>{r.report_summary}</p>
      </div>

      {r.requires_review?.length > 0 && (
        <Section title="Needs review" tone="review"><Plain items={r.requires_review} /></Section>
      )}
      {r.potential_inconsistencies?.length > 0 && (
        <Section title="Possible inconsistencies" tone="review"><Plain items={r.potential_inconsistencies} /></Section>
      )}

      <Section title="Patient information"><Pairs data={r.patient_information} /></Section>
      <Section title="Symptoms"><Items items={r.symptoms} /></Section>
      <Section title="Diagnoses and conditions"><Items items={r.diagnoses} /></Section>
      <Section title="Medications"><Meds items={r.medications} /></Section>
      <Section title="Vital signs"><Pairs data={r.vitals} /></Section>
      <Section title="Allergies"><Items items={r.allergies} /></Section>
      <Section title="Clinical observations"><Items items={r.clinical_observations} /></Section>
      <Section title="Clinical concerns"><Plain items={r.clinical_concerns} /></Section>
      <Section title="Missing or incomplete information"><Plain items={r.missing_information} empty="Nothing flagged as missing." /></Section>
    </section>
  );
}
