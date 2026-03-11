import React, { useState } from 'react';
import axios from 'axios';
import { Check, X, AlertCircle } from 'lucide-react';
import '../styles/review-queue.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ReviewQueue({ items, onResolve }) {
  const [resolving, setResolving] = useState({});

  const handleMerge = async (item) => {
    try {
      setResolving({ ...resolving, [item.id]: 'merging' });
      // Would call merge endpoint here
      await new Promise(r => setTimeout(r, 500)); // Simulate merge
      setResolving({ ...resolving, [item.id]: 'merged' });
      setTimeout(() => onResolve(), 1000);
    } catch (err) {
      setResolving({ ...resolving, [item.id]: 'error' });
    }
  };

  const handleReject = async (item) => {
    try {
      setResolving({ ...resolving, [item.id]: 'rejecting' });
      await new Promise(r => setTimeout(r, 500));
      setResolving({ ...resolving, [item.id]: 'rejected' });
      setTimeout(() => onResolve(), 1000);
    } catch (err) {
      setResolving({ ...resolving, [item.id]: 'error' });
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="review-empty">
        <h2>Review Queue</h2>
        <p>No ambiguous matches to review.</p>
        <p className="hint">All events have been auto-merged or kept separate.</p>
      </div>
    );
  }

  return (
    <div className="review-queue">
      <h2>Manual Review Queue</h2>
      <p className="review-info">
        {items.length} potential duplicates need your input.
      </p>

      <div className="review-items">
        {items.map((item) => (
          <div key={item.id} className="review-item">
            <div className="review-header">
              <AlertCircle size={20} />
              <span className="confidence">
                {item.confidence}% confidence match
              </span>
            </div>

            <div className="review-events">
              <div className="event-column">
                <h4>{item.tier1.name}</h4>
                <p>{item.tier1.date}</p>
                <p className="venue">{item.tier1.venue}</p>
                <span className="source-label">User-monitored</span>
              </div>

              <div className="vs">VS</div>

              <div className="event-column">
                <h4>{item.tier2.name}</h4>
                <p>{item.tier2.date}</p>
                <p className="venue">{item.tier2.venue}</p>
                <span className="source-label">{item.tier2.source}</span>
              </div>
            </div>

            <div className="review-actions">
              <button
                className={`action-button merge ${
                  resolving[item.id] ? resolving[item.id] : ''
                }`}
                onClick={() => handleMerge(item)}
                disabled={!!resolving[item.id]}
              >
                <Check size={16} />
                {resolving[item.id] === 'merged' ? 'Merged' : 'Merge'}
              </button>
              <button
                className={`action-button reject ${
                  resolving[item.id] ? resolving[item.id] : ''
                }`}
                onClick={() => handleReject(item)}
                disabled={!!resolving[item.id]}
              >
                <X size={16} />
                {resolving[item.id] === 'rejected' ? 'Rejected' : 'Keep Separate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
