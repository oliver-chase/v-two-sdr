import React, { useState } from 'react';
import '../styles/event-detail.css';

export default function EventDetail({ event, onBack }) {
  const [isFavorited, setIsFavorited] = useState(false);

  if (!event) {
    return (
      <div className="event-detail-empty">
        <p>No event selected</p>
        <button onClick={onBack} className="back-btn">← Back</button>
      </div>
    );
  }

  const eventDate = event.instances?.[0]?.date || event.date;
  const eventTime = event.instances?.[0]?.time || event.time;
  const venueName = event.venue?.name || event.location || 'TBA';
  const venueCity = event.venue?.city || event.city || '';
  const venueState = event.venue?.state || '';
  const costLabel = event.cost?.label || 'Free';
  const costAmount = event.cost?.amount ? `$${event.cost.amount}` : 'Free';

  const handleExportIcal = () => {
    // Generate iCal format
    const ical = generateIcal(event);
    const blob = new Blob([ical], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="event-detail">
      <button onClick={onBack} className="back-btn">← Back</button>

      <div className="event-detail-header">
        <div className="event-detail-title-section">
          <h1 className="event-detail-title">{event.name}</h1>
          <div className="event-detail-badges">
            {event.cost && (
              <span className={`cost-badge cost-${event.cost.type || 'free'}`}>
                {costAmount}
              </span>
            )}
            {event.event_types && event.event_types.length > 0 && (
              <span className="event-type-badge">{event.event_types[0]}</span>
            )}
            {event.source && (
              <span className="source-badge">{event.source}</span>
            )}
          </div>
        </div>
        <button 
          className={`heart-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={() => setIsFavorited(!isFavorited)}
          aria-label="Toggle favorite"
        >
          ♥
        </button>
      </div>

      <div className="event-detail-content">
        {/* Date & Time Section */}
        <section className="detail-section">
          <h3>When</h3>
          <div className="detail-text">
            {eventDate && (
              <p><strong>Date:</strong> {new Date(eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            )}
            {eventTime && (
              <p><strong>Time:</strong> {eventTime}</p>
            )}
          </div>
        </section>

        {/* Venue Section */}
        <section className="detail-section">
          <h3>Where</h3>
          <div className="detail-text">
            <p><strong>Venue:</strong> {venueName}</p>
            {venueCity && (
              <p><strong>Location:</strong> {venueCity}{venueState ? `, ${venueState}` : ''}</p>
            )}
            {event.venue?.address && (
              <p><strong>Address:</strong> {event.venue.address}</p>
            )}
            {event.venue?.url && (
              <p>
                <strong>Website:</strong>{' '}
                <a href={event.venue.url} target="_blank" rel="noopener noreferrer">
                  Visit venue →
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Description Section */}
        {event.description && (
          <section className="detail-section">
            <h3>About</h3>
            <div className="detail-text">
              <p>{event.description}</p>
            </div>
          </section>
        )}

        {/* Details Section */}
        <section className="detail-section">
          <h3>Details</h3>
          <div className="detail-text">
            {event.cost && (
              <p><strong>Cost:</strong> {costLabel}</p>
            )}
            {event.event_types && event.event_types.length > 0 && (
              <p><strong>Type:</strong> {event.event_types.join(', ')}</p>
            )}
            {event.recurrence && (
              <p><strong>Recurrence:</strong> {event.recurrence}</p>
            )}
            {event.source && (
              <p><strong>Source:</strong> {event.source}</p>
            )}
            {event.url && (
              <p>
                <strong>Event Link:</strong>{' '}
                <a href={event.url} target="_blank" rel="noopener noreferrer">
                  View event →
                </a>
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="event-detail-actions">
        <button onClick={handleExportIcal} className="action-btn ical-btn">
          📅 Export to Calendar
        </button>
        <button onClick={onBack} className="action-btn back-btn-secondary">
          ← Back to List
        </button>
      </div>
    </div>
  );
}

function generateIcal(event) {
  const eventDate = event.instances?.[0]?.date || event.date;
  const eventTime = event.instances?.[0]?.time || event.time;
  const venueName = event.venue?.name || event.location || 'TBA';
  
  // Convert date to iCal format (YYYYMMDD)
  const dateObj = new Date(eventDate);
  const icalDate = dateObj.toISOString().split('T')[0].replace(/-/g, '');
  
  // Simple iCal format
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Fallow//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:fallow-${event.id}-${Date.now()}@fallow.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${icalDate}
SUMMARY:${event.name}
DESCRIPTION:${event.description || 'No description'}
LOCATION:${venueName}
URL:${event.url || ''}
END:VEVENT
END:VCALENDAR`;
}
