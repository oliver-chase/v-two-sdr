import React, { useState } from 'react';
import useFetchData from '../hooks/useFetchData';
import ConfirmDialog from './Shared/ConfirmDialog';
import ErrorBanner from './Shared/ErrorBanner';
import './ConfigEditor.css';

// Determine the input type for a given value
function getFieldType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  return 'string';
}

// Build a diff string for changed fields: "field: old → new"
function buildDiffMessage(original, edited) {
  const lines = [];
  for (const key of Object.keys(edited)) {
    const oldVal = Array.isArray(original[key])
      ? original[key].join(', ')
      : String(original[key]);
    const newVal = Array.isArray(edited[key])
      ? edited[key].join(', ')
      : String(edited[key]);
    if (oldVal !== newVal) {
      lines.push(`${key}: ${oldVal} → ${newVal}`);
    }
  }
  return lines.join('\n');
}

// Convert the editable state values back to their proper types
function coerceValue(originalValue, editedString) {
  if (typeof originalValue === 'boolean') {
    return editedString; // already a boolean from checkbox
  }
  if (Array.isArray(originalValue)) {
    return editedString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return editedString;
}

// Skeleton rows shown during loading
function LoadingSkeleton() {
  return (
    <div className="config-editor config-editor-loading" aria-label="Loading configuration">
      <div className="config-editor-header">
        <div className="skeleton config-skeleton-title" />
      </div>
      <div className="config-fields">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="config-field-row config-field-row-skeleton">
            <div className="skeleton config-skeleton-label" />
            <div className="skeleton config-skeleton-value" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="config-editor config-editor-empty">
      <h2 className="config-heading">Configuration</h2>
      <p className="config-empty-message">No configuration data available.</p>
    </div>
  );
}

export default function ConfigEditor() {
  const { data, loading, error, refetch } = useFetchData('/api/claude-config');

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message="Failed to load configuration" onRetry={refetch} />;
  if (!data) return <EmptyState />;

  // Build initial edit values from data (flatten arrays to comma-separated strings)
  const initEditing = () => {
    const initial = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val)) {
        initial[key] = val.join(', ');
      } else {
        initial[key] = val;
      }
    }
    setEditValues(initial);
    setValidationErrors({});
    setIsEditing(true);
  };

  const handleFieldChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = () => {
    // Validate required fields (non-empty string fields from original)
    const errors = {};
    for (const key of Object.keys(data)) {
      const originalVal = data[key];
      // Required: original value is a non-empty string
      if (typeof originalVal === 'string' && originalVal !== '') {
        const edited = editValues[key];
        if (typeof edited === 'string' && edited.trim() === '') {
          errors[key] = 'This field is required.';
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Compute changed fields only
    const changed = {};
    for (const key of Object.keys(data)) {
      const coerced = coerceValue(data[key], editValues[key]);
      const originalStr = Array.isArray(data[key])
        ? data[key].join(', ')
        : String(data[key]);
      const editedStr = Array.isArray(coerced)
        ? coerced.join(', ')
        : String(coerced);
      if (originalStr !== editedStr) {
        changed[key] = coerced;
      }
    }

    if (Object.keys(changed).length === 0) {
      // Nothing changed; just exit edit mode
      setIsEditing(false);
      return;
    }

    setPendingChanges(changed);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingChanges),
    });
    setIsEditing(false);
    setPendingChanges({});
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({});
    setValidationErrors({});
  };

  const diffMessage = buildDiffMessage(data, pendingChanges);

  return (
    <div className="config-editor fade-in">
      <div className="config-editor-header">
        <h2 className="config-heading">Configuration</h2>
        <div className="config-actions">
          {!isEditing ? (
            <button className="btn btn-secondary" onClick={initEditing}>
              Edit
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="btn" onClick={handleSave}>
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="config-fields">
        {Object.entries(data).map(([key, value]) => {
          const fieldType = getFieldType(value);
          const hasError = !!validationErrors[key];

          return (
            <div key={key} className="config-field-row">
              <label className="config-field-label" htmlFor={`config-field-${key}`}>
                {key}
              </label>
              <div className="config-field-value-wrapper">
                {!isEditing ? (
                  <span className="config-field-display">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                ) : fieldType === 'boolean' ? (
                  <input
                    id={`config-field-${key}`}
                    type="checkbox"
                    checked={!!editValues[key]}
                    onChange={(e) => handleFieldChange(key, e.target.checked)}
                    className="config-field-checkbox"
                  />
                ) : (
                  <input
                    id={`config-field-${key}`}
                    type="text"
                    value={editValues[key] ?? ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className={`config-field-input${hasError ? ' config-field-input-error' : ''}`}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `config-error-${key}` : undefined}
                  />
                )}
                {hasError && (
                  <span
                    id={`config-error-${key}`}
                    className="config-field-error"
                    role="alert"
                  >
                    {validationErrors[key]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Configuration Changes"
        message={diffMessage}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
