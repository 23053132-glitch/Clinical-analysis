import { useState } from 'react';
import NewAnalysis from './components/NewAnalysis.jsx';
import History from './components/History.jsx';
import ReportView from './components/ReportView.jsx';

export default function App() {
  const [view, setView] = useState({ name: 'new' });

  const go = (name, id) => {
    setView({ name, id });
  };

  const isReport = view.name === 'report';

  return (
    <div className="app">
      {/* Ambient background */}
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">
        <div className="topbar-inner">
          <button
            className="brand"
            onClick={() => go('new')}
            aria-label="Clinical Document Reviewer home"
          >
            <span className="brand-mark">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4V20M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span className="brand-copy">
              <span className="brand-name">Clinical</span>
              <span className="brand-subtitle">Document Reviewer</span>
            </span>
          </button>

          <nav className="nav">
            <button
              className={`nav-button ${view.name === 'new' ? 'active' : ''}`}
              onClick={() => go('new')}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              New review
            </button>

            <button
              className={`nav-button ${
                view.name === 'history' || isReport ? 'active' : ''
              }`}
              onClick={() => go('history')}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V6.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 9H16M8 13H16M8 17H13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Past reports
            </button>
          </nav>

          <div className="header-status">
            <span className="status-dot" />
            <span>System ready</span>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="content">
          {view.name === 'new' && (
            <NewAnalysis
              onDone={(analysis) => go('report', analysis._id)}
              onFailed={(id) => id && go('report', id)}
            />
          )}

          {view.name === 'history' && (
            <History onOpen={(id) => go('report', id)} />
          )}

          {view.name === 'report' && (
            <ReportView
              key={view.id}
              id={view.id}
              onBack={() => go('history')}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3L20 6V11.5C20 16.2 16.7 20.5 12 21C7.3 20.5 4 16.2 4 11.5V6L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
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
              Demo environment · Synthetic data only
            </span>
          </div>

          <div className="footer-right">
            <span>AI-generated output</span>
            <span className="footer-separator">•</span>
            <span>Clinical review required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}