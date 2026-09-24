import { useState } from 'react';
import { createAnalysis } from '../api.js';
import { SAMPLE_NOTE } from '../sample.js';

const MAX_MB = 10;
const TABS = [
  { id: 'text', label: 'Type or paste' },
  { id: 'image', label: 'Image', accept: 'image/png,image/jpeg,image/webp', types: ['image/png', 'image/jpeg', 'image/webp'] },
  { id: 'pdf', label: 'PDF', accept: 'application/pdf', types: ['application/pdf'] },
];

export default function NewAnalysis({ onDone, onFailed }) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const current = TABS.find((t) => t.id === tab);

  function pickTab(id) {
    setTab(id);
    setFile(null);
    setError('');
  }

  function pickFile(e) {
    const f = e.target.files?.[0];
    setError('');
    if (!f) return setFile(null);
    if (!current.types.includes(f.type)) {
      setFile(null);
      return setError(tab === 'pdf' ? 'That is not a PDF. Choose a .pdf file.' : 'Unsupported image. Use PNG, JPG or WebP.');
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      return setError(`File is larger than ${MAX_MB} MB.`);
    }
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (tab === 'text' && !text.trim()) return setError('Enter some clinical notes first.');
    if (tab !== 'text' && !file) return setError('Choose a file first.');

    setBusy(true);
    try {
      const analysis = await createAnalysis(tab === 'text' ? { text } : { file });
      onDone(analysis);
    } catch (err) {
      setError(err.message);
      onFailed?.(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="new">
      <h1>Review a clinical document</h1>
      <p className="lede">Submit a note, a photo of a note, or a PDF. You get a short summary and a structured breakdown, with anything unclear flagged.</p>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => pickTab(t.id)} disabled={busy}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        {tab === 'text' ? (
          <>
            <label htmlFor="note">Clinical notes</label>
            <textarea id="note" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or type the note here" disabled={busy} />
            <button type="button" className="link" onClick={() => setText(SAMPLE_NOTE)} disabled={busy}>Use a sample note</button>
          </>
        ) : (
          <>
            <label htmlFor="file">{tab === 'pdf' ? 'PDF file' : 'Image file'}</label>
            <input id="file" key={tab} type="file" accept={current.accept} onChange={pickFile} disabled={busy} />
            {file && <p className="hint">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
            <p className="hint">Typed, scanned and handwritten documents are supported. Maximum {MAX_MB} MB.</p>
          </>
        )}

        {error && <div className="banner error" role="alert">{error}</div>}
        {busy && (
          <div className="banner info" role="status">
            <span className="spinner" aria-hidden="true" /> Reading the document and building the report. This usually takes 10 to 30 seconds.
          </div>
        )}

        <button className="primary" type="submit" disabled={busy}>{busy ? 'Analyzing...' : 'Analyze document'}</button>
      </form>
    </section>
  );
}
