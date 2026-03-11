import React, { useState } from 'react';
import '../styles/add-venue-modal.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CITIES = [
  'Denver', 'Boulder', 'Arvada', 'Fort Collins',
  'Colorado Springs', 'Littleton', 'Aurora', 'Lakewood'
];

const STATES = ['CO', 'NY', 'CA', 'TX', 'IL'];

const EVENT_TYPES = [
  'Festival', 'Concert', 'Market', 'Workshop',
  'Gallery', 'Sports', 'Food', 'Theater',
  'Comedy', 'Class', 'Conference', 'Community Event'
];

export default function AddVenueModal({ venueNamePrefill, isOpen, onClose, onVenueAdded }) {
  const [formData, setFormData] = useState({
    name: venueNamePrefill || '',
    city: 'Denver',
    state: 'CO',
    url: '',
    event_types: [],
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEventTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(type)
        ? prev.event_types.filter(t => t !== type)
        : [...prev.event_types, type]
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Venue name is required');
      return false;
    }
    if (!formData.city) {
      setError('City is required');
      return false;
    }
    if (formData.url && !isValidUrl(formData.url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const isValidUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (str) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit venue');
        return;
      }

      setSuccess(true);
      setSuccessData(data);
      if (onVenueAdded) {
        setTimeout(() => {
          onVenueAdded(data);
        }, 2000);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      city: 'Denver',
      state: 'CO',
      url: '',
      event_types: [],
      email: ''
    });
    setError(null);
    setSuccess(false);
    setSuccessData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Venue</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {success ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h3>Venue Added Successfully!</h3>
            <p className="success-venue-name">{successData?.name}</p>
            <p className="success-message">We'll start monitoring this venue weekly for new events.</p>
            <div className="success-details">
              <p><strong>Location:</strong> {successData?.city}, {successData?.state}</p>
              <p><strong>Venue ID:</strong> {successData?.id}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="venue-form">
            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Venue Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Lakewood Pottery Studio"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="url">Website URL (optional)</label>
              <input
                id="url"
                type="text"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com"
                disabled={loading}
              />
              <div className="form-hint">Enter the venue's website or events page</div>
            </div>

            <div className="form-group">
              <label>Event Types (optional)</label>
              <div className="event-types-grid">
                {EVENT_TYPES.map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.event_types.includes(type)}
                      onChange={() => handleEventTypeChange(type)}
                      disabled={loading}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
              <div className="form-hint">Select the types of events hosted here</div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email for Confirmation (optional)</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled={loading}
              />
              <div className="form-hint">We'll send you confirmation when we start monitoring</div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding Venue...' : 'Add Venue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
