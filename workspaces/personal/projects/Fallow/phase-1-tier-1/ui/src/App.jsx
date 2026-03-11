import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EventList from './components/EventList';
import EventDetail from './components/EventDetail';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import ReviewQueue from './components/ReviewQueue';
import SweepStatus from './components/SweepStatus';
import AddVenueModal from './components/AddVenueModal';
import './styles/app.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filters, setFilters] = useState({
    city: 'all',
    type: 'all',
    dateRange: 'upcoming',
    cost: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sweepStatus, setSweepStatus] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
  const [venueNamePrefill, setVenueNamePrefill] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load events and favorites on mount
  useEffect(() => {
    loadEvents();
    loadSweepStatus();
    loadReviewQueue();
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('fallow_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  // Filter events when filters change
  useEffect(() => {
    filterEvents();
  }, [events, filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/events/all`);
      setEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSweepStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/sweep/latest`);
      setSweepStatus(response.data);
    } catch (err) {
      // Sweep not run yet, no error
    }
  };

  const loadReviewQueue = async () => {
    try {
      // Would load from /logs/review_[id].json endpoint
      // For now, stub
      setReviewQueue([]);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    }
  };

  const triggerSweep = async () => {
    try {
      await axios.post(`${API_BASE}/api/sweep`, {
        cities: ['Denver', 'Boulder', 'Arvada'],
        apiKeys: {},
      });
      // Poll for results
      setTimeout(() => {
        loadEvents();
        loadSweepStatus();
      }, 2000);
    } catch (err) {
      setError('Failed to trigger sweep');
    }
  };

  const handleVenueSelect = (venue) => {
    // Filter to show events from this venue
    setFilters(prev => ({
      ...prev,
      city: venue.city
    }));
  };

  const handleAddVenue = (venueName) => {
    setVenueNamePrefill(venueName);
    setIsAddVenueModalOpen(true);
  };

  const handleVenueAdded = (venueData) => {
    setIsAddVenueModalOpen(false);
    setVenueNamePrefill('');
    // Optionally reload events to show new venue
    setTimeout(() => {
      loadEvents();
    }, 1000);
  };

  const handleToggleFavorite = (eventId) => {
    const updated = favorites.includes(eventId)
      ? favorites.filter(id => id !== eventId)
      : [...favorites, eventId];
    setFavorites(updated);
    localStorage.setItem('fallow_favorites', JSON.stringify(updated));
  };

  const filterEvents = () => {
    let filtered = events;

    // City
    if (filters.city !== 'all') {
      filtered = filtered.filter(e => e.city === filters.city);
    }

    // Type
    if (filters.type !== 'all') {
      filtered = filtered.filter(e => 
        e.event_types?.includes(filters.type)
      );
    }

    // Cost
    if (filters.cost !== 'all') {
      filtered = filtered.filter(e => {
        const cost = e.cost?.type || 'free';
        return cost === filters.cost;
      });
    }

    // Date range
    const today = new Date();
    if (filters.dateRange === 'upcoming') {
      filtered = filtered.filter(e => {
        const eventDate = e.instances?.[0]?.date || e.date;
        return eventDate && new Date(eventDate) >= today;
      });
    } else if (filters.dateRange === 'week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter(e => {
        const eventDate = e.instances?.[0]?.date || e.date;
        return eventDate && new Date(eventDate) >= today && new Date(eventDate) <= nextWeek;
      });
    } else if (filters.dateRange === 'month') {
      const nextMonth = new Date(today);
      nextMonth.setDate(nextMonth.getDate() + 30);
      filtered = filtered.filter(e => {
        const eventDate = e.instances?.[0]?.date || e.date;
        return eventDate && new Date(eventDate) >= today && new Date(eventDate) <= nextMonth;
      });
    }

    setFilteredEvents(filtered);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>FALLOW</h1>
        <p>Unearth the Unexpected</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Events
        </button>
        <button
          className={`tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Review Queue ({reviewQueue.length})
        </button>
        <button
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status
        </button>
      </nav>

      <main className="main">
        {activeTab === 'browse' && (
          <section className="browse-section">
            {!selectedEvent ? (
              <>
                <SearchBar 
                  onVenueSelect={handleVenueSelect}
                  onAddVenue={handleAddVenue}
                />
                <FilterPanel filters={filters} onFilterChange={setFilters} />

                {error && <div className="error">{error}</div>}
                {loading ? (
                  <div className="loading">Loading events...</div>
                ) : (
                  <div className="results">
                    <p className="result-count">
                      {filteredEvents.length} of {events.length} events
                    </p>
                    <EventList 
                      events={filteredEvents}
                      favorites={favorites}
                      onFavorite={handleToggleFavorite}
                      onEventClick={setSelectedEvent}
                    />
                  </div>
                )}
              </>
            ) : (
              <EventDetail 
                event={selectedEvent}
                onBack={() => setSelectedEvent(null)}
              />
            )}
          </section>
        )}

        {activeTab === 'review' && (
          <section className="review-section">
            <ReviewQueue items={reviewQueue} onResolve={loadEvents} />
          </section>
        )}

        {activeTab === 'status' && (
          <section className="status-section">
            <SweepStatus status={sweepStatus} onSweep={triggerSweep} />
          </section>
        )}
      </main>

      <AddVenueModal 
        venueNamePrefill={venueNamePrefill}
        isOpen={isAddVenueModalOpen}
        onClose={() => setIsAddVenueModalOpen(false)}
        onVenueAdded={handleVenueAdded}
      />
    </div>
  );
}
