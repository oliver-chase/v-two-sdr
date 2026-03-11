import React from 'react';
import EventCard from './EventCard';
import '../styles/event-list.css';

export default function EventList({ events, favorites = [], onFavorite, onEventClick }) {
  if (!events || events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div className="empty-state-title">No events found</div>
        <div className="empty-state-text">Try adjusting your filters or search to discover more events</div>
      </div>
    );
  }

  return (
    <div className="event-list">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event}
          onFavorite={onFavorite}
          onClick={onEventClick}
          isFavorited={favorites.includes(event.id)}
        />
      ))}
    </div>
  );
}
