import { useState } from 'react';
import NewAnalysis from './components/NewAnalysis.jsx';
import History from './components/History.jsx';
import ReportView from './components/ReportView.jsx';

export default function App() {
  const [view, setView] = useState({ name: 'new' });
  const go = (name, id) => setView({ name, id });

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">Clinical Document Reviewer</div>
        <nav>
          <button className={view.name === 'new' ? 'on' : ''} onClick={() => go('new')}>New review</button>
          <button className={view.name !== 'new' ? 'on' : ''} onClick={() => go('history')}>Past reports</button>
        </nav>
      </header>
      <main>
        {view.name === 'new' && <NewAnalysis onDone={(a) => go('report', a._id)} onFailed={(id) => id && go('report', id)} />}
        {view.name === 'history' && <History onOpen={(id) => go('report', id)} />}
        {view.name === 'report' && <ReportView key={view.id} id={view.id} onBack={() => go('history')} />}
      </main>
      <footer>Demo only. Uses synthetic data. Output is AI-generated and must be checked by a clinician.</footer>
    </div>
  );
}
