import React from 'react';

interface Props {
  activeTab: 'generation' | 'simulation';
  onTabChange: (tab: 'generation' | 'simulation') => void;
  onOpenParams: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenParams,
}) => {
  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="Nabha-Net home">
        <span className="brand-mark">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M5 23.5C11 22 12 13 16 7c2.7 7.8 5.2 13.5 11 15.8-7.1 4.2-16.2 4.5-22-.3Z"
              fill="currentColor"
            />
            <path
              d="M8 25c4-6 7-10 12-14"
              stroke="#f6f8f2"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="9" cy="8" r="1.2" fill="currentColor" />
            <circle cx="24" cy="7" r="1.6" fill="currentColor" />
          </svg>
        </span>
        <span className="brand-name">
          Nabha-Net <small>RURAL TELEMEDICINE NETWORKS</small>
        </span>
      </a>

      <nav className="top-tabs" role="tablist" aria-label="Project sections">
        <button
          className={`top-tab ${activeTab === 'generation' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'generation'}
          onClick={() => onTabChange('generation')}
        >
          <span className="tab-icon">⌘</span>Map Generation
        </button>
        <button
          className={`top-tab ${activeTab === 'simulation' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'simulation'}
          onClick={() => onTabChange('simulation')}
        >
          <span className="tab-icon">✳</span>Ant Simulation
        </button>
      </nav>

      <div className="header-right">
        <button
          className="params-btn"
          type="button"
          onClick={onOpenParams}
          title="Tune ACO hyperparameters and cost weights"
        >
          <span>⚙</span> ACO Tuning
        </button>
        <div className="project-chip">
          <span className="chip-dot"></span> Combined Architecture
        </div>
      </div>
    </header>
  );
};
