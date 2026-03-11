import React, { useState, useMemo } from 'react';
import useFetchData from '../hooks/useFetchData';
import ErrorBanner from './Shared/ErrorBanner';
import './AuditTrail.css';

const PAGE_SIZE = 50;
const CHANGE_TYPES = ['All', 'Config', 'Plugin', 'Skill'];
const SKELETON_ROW_COUNT = 8;

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString();
}

function buildCSV(entries) {
  const header = ['Timestamp', 'Description', 'Change Type', 'Old Value', 'New Value', 'Actor'];
  const rows = entries.map((e) => [
    formatTimestamp(e.timestamp),
    e.description,
    e.changeType,
    e.oldValue,
    e.newValue,
    e.actor,
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function triggerCSVDownload(entries) {
  const csv = buildCSV(entries);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'audit-log.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <tr key={i} className="audit-skeleton-row">
          {Array.from({ length: 5 }, (__, j) => (
            <td key={j}>
              <div className="skeleton audit-skeleton-cell" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const AuditTrail = () => {
  const { data, loading, error, refetch } = useFetchData('/api/audit-log');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [changeType, setChangeType] = useState('All');
  const [page, setPage] = useState(1);

  const entries = data?.entries ?? [];

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      // Extract local calendar date as YYYY-MM-DD string for comparison
      const ts = new Date(e.timestamp);
      const tsDateStr = [
        ts.getFullYear(),
        String(ts.getMonth() + 1).padStart(2, '0'),
        String(ts.getDate()).padStart(2, '0'),
      ].join('-');

      if (fromDate && tsDateStr < fromDate) return false;
      if (toDate && tsDateStr > toDate) return false;
      if (changeType !== 'All' && e.changeType !== changeType) return false;

      return true;
    });
  }, [entries, fromDate, toDate, changeType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEntries = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleFromDate = (e) => {
    setFromDate(e.target.value);
    setPage(1);
  };

  const handleToDate = (e) => {
    setToDate(e.target.value);
    setPage(1);
  };

  const handleChangeType = (e) => {
    setChangeType(e.target.value);
    setPage(1);
  };

  const handleExportCSV = () => {
    triggerCSVDownload(filtered);
  };

  return (
    <section className="audit-trail card">
      <div className="audit-header">
        <h2 className="audit-title">Audit Log</h2>
        <button className="btn audit-export-btn" onClick={handleExportCSV}>
          Export CSV
        </button>
      </div>

      <div className="audit-filters">
        <label className="audit-filter-label" htmlFor="audit-from-date">
          From date
          <input
            id="audit-from-date"
            type="date"
            className="audit-date-input"
            value={fromDate}
            onChange={handleFromDate}
            aria-label="From date"
          />
        </label>

        <label className="audit-filter-label" htmlFor="audit-to-date">
          To date
          <input
            id="audit-to-date"
            type="date"
            className="audit-date-input"
            value={toDate}
            onChange={handleToDate}
            aria-label="To date"
          />
        </label>

        <label className="audit-filter-label" htmlFor="audit-type-select">
          Change type
          <select
            id="audit-type-select"
            className="audit-type-select"
            value={changeType}
            onChange={handleChangeType}
            aria-label="Change type"
          >
            {CHANGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <ErrorBanner
          message={`Failed to load audit log: ${error.message}`}
          onRetry={refetch}
        />
      )}

      {loading && (
        <div className="audit-table-wrapper">
          <table className="audit-table" aria-label="Audit log loading">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Description</th>
                <th>Type</th>
                <th>Old / New</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRows />
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="audit-empty">No audit log entries for this period.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="audit-table-wrapper">
            <table className="audit-table" aria-label="Audit log entries">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Old / New</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map((entry) => (
                  <tr key={entry.id} data-testid="audit-row">
                    <td data-testid="entry-timestamp">{formatTimestamp(entry.timestamp)}</td>
                    <td>{entry.description}</td>
                    <td data-testid="entry-type">
                      <span className={`badge audit-type-badge audit-type-${entry.changeType.toLowerCase()}`}>
                        {entry.changeType}
                      </span>
                    </td>
                    <td>
                      <span className="audit-old-value">{entry.oldValue}</span>
                      <span className="audit-arrow"> to </span>
                      <span className="audit-new-value">{entry.newValue}</span>
                    </td>
                    <td>{entry.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="audit-pagination">
            <button
              className="btn btn-secondary audit-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              Prev
            </button>
            <span className="audit-page-indicator">
              Page {safePage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary audit-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default AuditTrail;
