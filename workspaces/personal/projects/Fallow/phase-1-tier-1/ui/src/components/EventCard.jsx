import React, { useState } from 'react';
import '../styles/event-card.css';

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric'
  });
};

const getCostBadgeStyle = (cost) => {
  const type = cost?.type || 'free';
  const levels = {
    free: { label: 'Free', className: 'badge-free' },
    paid: { label: '$', className: 'badge-paid' },
    tiered: { label: '$$', className: 'badge-tiered' }
  };
  return levels[type] || levels.free;
};

export default function EventCard({ event, onFavorite, isFavorited, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleFavorite = (e) => {
    e.stopPropagation();
    onFavorite?.(event.id);
  };

  const handleClick = () => {
    onClick?.(event);
  };

  const costBadge = getCostBadgeStyle(event.cost);
  const eventDate = event.instances?.[0]?.date || event.date;
  const venue = event.venue_enrichment?.name || event.venue;
  const city = event.venue_enrichment?.city || event.city;

  return (
    <div 
      className="event-card"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Header */}
      <div className="event-card-header">
        <div className="event-title-section">
          <h3 className="event-title">{event.name}</h3>
          {event.event_types && event.event_types.length > 0 && (
            <span className="event-category">{event.event_types[0]}</span>
          )}
        </div>
        
        <button 
          className={`heart-button ${isFavorited ? 'favorited' : ''}`}
          onClick={handleFavorite}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      {/* Cost Badge */}
      <div className={`cost-badge ${costBadge.className}`}>
        {costBadge.label}
      </div>

      {/* Venue & Location */}
      <div className="event-location-info">
        <div className="venue-name">{venue}</div>
        {city && (
          <div className="venue-city">
            {city}{event.state ? `, ${event.state}` : ''}
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="event-datetime">
        <span className="event-date">
          {formatDate(eventDate)}
        </span>
        {event.instances?.[0]?.time && (
          <span className="event-time">
            {event.instances[0].time}
          </span>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="event-description">
          {event.description.length > 120 
            ? event.description.substring(0, 120) + '...' 
            : event.description}
        </p>
      )}

      {/* Recurrence Info */}
      {event.recurrencePattern && (
        <div className="event-recurrence">
          {event.recurrencePattern === 'annual' && '📅 Annual'}
          {event.recurrencePattern === 'weekly' && '🔄 Weekly'}
          {event.recurrencePattern === 'monthly' && '📆 Monthly'}
        </div>
      )}

      {/* Footer */}
      <div className="event-footer">
        <div className="event-sources">
          {(event.sources || []).slice(0, 2).map((source) => (
            <span key={source} className="source-badge">
              {source.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
