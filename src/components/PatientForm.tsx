import React, { useRef } from 'react';
import { CONDITIONS } from '../data/mapGenerator';
import type {
  PatientCategory,
  PatientProfile,
  RegionMap,
  UrgencyLevel,
} from '../types';

interface Props {
  profile: PatientProfile;
  setProfile: React.Dispatch<React.SetStateAction<PatientProfile>>;
  region: RegionMap;
  onRunSimulation: () => void;
  onAdvanceAnt: () => void;
  stepProgressText: string;
}

export const PatientForm: React.FC<Props> = ({
  profile,
  setProfile,
  region,
  onRunSimulation,
  onAdvanceAnt,
  stepProgressText,
}) => {
  const currentCondition = CONDITIONS[profile.conditionKey] || CONDITIONS.cardiac;
  const holdTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const heldRef = useRef(false);

  function handlePointerDown() {
    heldRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      heldRef.current = true;
      onAdvanceAnt();
      intervalRef.current = window.setInterval(onAdvanceAnt, 450);
    }, 300);
  }

  function handlePointerUp() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!heldRef.current) {
      onAdvanceAnt();
    }
    heldRef.current = false;
  }

  return (
    <section className="patient-card" aria-label="Patient details">
      <div className="settings-heading">
        <span className="section-step step-green">02</span>
        <div>
          <span className="card-eyebrow">PATIENT DETAILS</span>
          <h2>Who needs care?</h2>
        </div>
      </div>
      <p className="settings-intro">
        The patient’s condition and urgency determine eligible facilities and emergency corridor priority.
      </p>

      {/* Village Select */}
      <div className="form-field">
        <label htmlFor="village-select">Village location</label>
        <div className="select-shell">
          <select
            id="village-select"
            value={profile.villageId}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, villageId: e.target.value }))
            }
          >
            {region.villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} village
              </option>
            ))}
          </select>
          <span>⌄</span>
        </div>
      </div>

      {/* Category and Age */}
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: '8px' }}>
        <div className="form-field">
          <label htmlFor="patient-type">Patient type</label>
          <div className="select-shell">
            <select
              id="patient-type"
              value={profile.category}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  category: e.target.value as PatientCategory,
                }))
              }
            >
              <option value="Adult">Adult</option>
              <option value="Child">Child</option>
              <option value="Senior">Senior</option>
              <option value="Maternal">Maternal</option>
            </select>
            <span>⌄</span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="patient-age">
            Age <small>OPTIONAL</small>
          </label>
          <div className="input-shell">
            <input
              id="patient-age"
              type="number"
              placeholder="e.g. 46"
              value={profile.age}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, age: e.target.value }))
              }
            />
            <span>yrs</span>
          </div>
        </div>
      </div>

      {/* Suspected Condition */}
      <div className="form-field">
        <label htmlFor="condition-select">Suspected condition</label>
        <div className="select-shell">
          <select
            id="condition-select"
            value={profile.conditionKey}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, conditionKey: e.target.value }))
            }
          >
            {Object.values(CONDITIONS).map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <span>⌄</span>
        </div>
        <small className="field-help">{currentCondition.hint}</small>
      </div>

      {/* Urgency / Criticality Radio Grid */}
      <fieldset className="priority-field">
        <legend>Patient criticality</legend>
        <div className="priority-grid">
          {(
            [
              { key: 'critical', title: 'Critical', desc: 'Immediate, emergency' },
              { key: 'urgent', title: 'Urgent', desc: 'Needs prompt care' },
              { key: 'moderate', title: 'Moderate', desc: 'Stable, assessment' },
              { key: 'low', title: 'Low', desc: 'Routine referral' },
            ] as const
          ).map((item) => {
            const isSelected = profile.urgency === item.key;
            return (
              <label
                key={item.key}
                className={`priority-choice priority-${item.key} ${
                  isSelected ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={item.key}
                  checked={isSelected}
                  onChange={() =>
                    setProfile((prev) => ({
                      ...prev,
                      urgency: item.key as UrgencyLevel,
                    }))
                  }
                />
                <span className="priority-dot"></span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Action Buttons */}
      <button
        className="primary-button"
        type="button"
        onClick={onRunSimulation}
      >
        <span>Run ant simulation</span>
        <b>✳</b>
      </button>

      <button
        className="step-ant-button"
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        Next ant <span>→</span>
      </button>

      <p className="step-hint">
        Click once for a single ant, or press & hold to release ants continuously.
      </p>

      <div className="step-progress" role="status" aria-live="polite">
        {stepProgressText}
      </div>

      <div className="algorithm-caption">
        <span>✳</span> ANT COLONY OPTIMIZATION <i>·</i> MULTI-OBJECTIVE
      </div>
    </section>
  );
};
