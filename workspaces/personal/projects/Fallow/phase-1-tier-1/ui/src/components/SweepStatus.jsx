import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/date';
import '../styles/sweep-status.css';

export default function SweepStatus({ status, onSweep }) {
  const isComplete = status?.status === 'complete';
  const isFailed = status?.status === 'failed';

  return (
    <div className="sweep-status">
      <h2>Sweep Status</h2>

      {!status ? (
        <div className="status-empty">
          <p>No sweeps have been run yet.</p>
          <button className="sweep-button" onClick={onSweep}>
            <RefreshCw size={18} />
            Run Sweep Now
          </button>
          <p className="hint">
            A sweep combines user-monitored URLs with free APIs and removes
            duplicates.
          </p>
        </div>
      ) : (
        <div className={`status-panel ${status.status}`}>
          <div className="status-header">
            {isComplete && <CheckCircle size={24} />}
            {isFailed && <AlertCircle size={24} />}
            {!isComplete && !isFailed && <RefreshCw size={24} />}
            <h3>{status.status.toUpperCase()}</h3>
            <time>{formatDate(status.timestamp)}</time>
          </div>

          {isComplete && (
            <div className="status-metrics">
              <div className="metric">
                <span className="label">Tier 1 Events</span>
                <span className="value">{status.phases.tier1.events}</span>
              </div>
              <div className="metric">
                <span className="label">Tier 2 Events</span>
                <span className="value">{status.phases.tier2.events}</span>
              </div>
              <div className="metric">
                <span className="label">Final Count</span>
                <span className="value">
                  {status.phases.dedup.metrics.final_count}
                </span>
              </div>
              <div className="metric">
                <span className="label">Auto-merged</span>
                <span className="value">
                  {status.phases.dedup.metrics.auto_merged}
                </span>
              </div>
              <div className="metric">
                <span className="label">Flagged for Review</span>
                <span className="value">
                  {status.phases.dedup.metrics.flagged_for_review}
                </span>
              </div>
              <div className="metric">
                <span className="label">Dedup Ratio</span>
                <span className="value">
                  {status.phases.dedup.metrics.dedup_ratio}%
                </span>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="error-message">
              <p>{status.error}</p>
            </div>
          )}

          <button className="sweep-button" onClick={onSweep}>
            <RefreshCw size={18} />
            Run Sweep Again
          </button>
        </div>
      )}

      <div className="sweep-info">
        <h4>How sweeps work:</h4>
        <ol>
          <li>Parse all user-monitored venue URLs</li>
          <li>Fetch data from free APIs (Meetup, Eventbrite, city calendars)</li>
          <li>Compare and deduplicate using fuzzy matching</li>
          <li>Save canonical event list and flag ambiguous matches for review</li>
        </ol>
      </div>
    </div>
  );
}
