/**
 * Phase 2-B: Free API Integrations
 * Meetup, Eventbrite, City Calendar APIs
 * 
 * All use free tiers (no payment required)
 */

/**
 * MEETUP API - Free tier
 * Docs: https://www.meetup.com/api/
 * Requires: API key from https://secure.meetup.com/meetup_api/console
 */
export class MeetupAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.meetup.com';
  }

  /**
   * Search for events by location and keywords
   */
  async searchEvents(city, state, keywords = [], radius = 25) {
    try {
      // Meetup Open Events API (free, no auth required for basic search)
      const url = new URL(`${this.baseUrl}/find/events`);
      url.searchParams.append('lon', this.getCityLongitude(city, state));
      url.searchParams.append('lat', this.getCityLatitude(city, state));
      url.searchParams.append('radius', radius);
      url.searchParams.append('format', 'json');

      const response = await fetch(url.toString(), {
        timeout: 10000,
        headers: { 'User-Agent': 'FALLOW/1.0' },
      });

      if (!response.ok) {
        return { success: false, error: `Meetup API ${response.status}`, events: [] };
      }

      const data = await response.json();
      
      return {
        success: true,
        events: (data.events || []).map(event => ({
          id: `meetup-${event.id}`,
          name: event.name,
          date: new Date(event.local_date).toISOString().split('T')[0],
          time: event.local_time || null,
          venue: event.venue?.name || 'TBD',
          city: event.venue?.city || city,
          state: state,
          type: 'meetup',
          url: event.link,
          source: 'meetup',
          attendees: event.yes_rsvp_count || 0,
        })),
        source: 'meetup',
      };
    } catch (err) {
      return { success: false, error: err.message, events: [] };
    }
  }

  getCityLatitude(city, state) {
    // Hardcoded for Colorado cities (expand as needed)
    const coords = {
      denver: 39.7392,
      boulder: 40.0150,
      arvada: 39.8011,
      'fort collins': 40.5853,
      colorado_springs: 38.8339,
    };
    return coords[city.toLowerCase()] || 39.7392;
  }

  getCityLongitude(city, state) {
    const coords = {
      denver: -104.9903,
      boulder: -105.2705,
      arvada: -105.0668,
      'fort collins': -105.0865,
      colorado_springs: -104.8202,
    };
    return coords[city.toLowerCase()] || -104.9903;
  }
}

/**
 * EVENTBRITE API - Free tier
 * Docs: https://www.eventbrite.com/api/
 * Requires: OAuth token from https://www.eventbrite.com/myaccount/apps/
 */
export class EventbriteAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://www.eventbriteapi.com/v3';
  }

  /**
   * Search for events by location
   */
  async searchEvents(city, state) {
    try {
      const url = new URL(`${this.baseUrl}/events/search/`);
      url.searchParams.append('location.address', `${city}, ${state}`);
      url.searchParams.append('sort_by', 'date');

      const response = await fetch(url.toString(), {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'User-Agent': 'FALLOW/1.0',
        },
      });

      if (!response.ok) {
        return { success: false, error: `Eventbrite API ${response.status}`, events: [] };
      }

      const data = await response.json();

      return {
        success: true,
        events: (data.events || []).map(event => ({
          id: `eventbrite-${event.id}`,
          name: event.name.text,
          date: new Date(event.start.local).toISOString().split('T')[0],
          time: new Date(event.start.local).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', ''),
          venue: event.venue?.name || 'TBD',
          city: event.venue?.address?.city || city,
          state: state,
          type: 'conference',
          url: event.url,
          source: 'eventbrite',
          attendees: event.capacity || 0,
        })),
        source: 'eventbrite',
      };
    } catch (err) {
      return { success: false, error: err.message, events: [] };
    }
  }
}

/**
 * CITY CALENDAR APIs - All free
 * Denver, Boulder, Arvada, etc.
 */
export class CityCalendarAPI {
  /**
   * Denver Parks & Recreation calendar
   * Public data, no API key needed
   */
  static async denverEvents() {
    try {
      // Denver uses ICS calendar feed
      const response = await fetch('https://www.denvergov.org/pocketgov/events.ics', {
        timeout: 10000,
      });

      if (!response.ok) {
        return { success: false, error: `Denver calendar ${response.status}`, events: [] };
      }

      const icsContent = await response.text();
      return {
        success: true,
        events: this.parseICS(icsContent, 'Denver', 'CO', 'denver'),
        source: 'denver_calendar',
      };
    } catch (err) {
      return { success: false, error: err.message, events: [] };
    }
  }

  /**
   * Boulder Community Events
   * Public events list
   */
  static async boulderEvents() {
    try {
      const response = await fetch('https://boulderevents.com/api/v1/events/?format=json', {
        timeout: 10000,
      });

      if (!response.ok) {
        return { success: false, error: `Boulder events ${response.status}`, events: [] };
      }

      const data = await response.json();
      return {
        success: true,
        events: (data.results || []).map(event => ({
          id: `boulder-${event.id}`,
          name: event.title,
          date: event.start_date,
          time: event.start_time || null,
          venue: event.venue || 'TBD',
          city: 'Boulder',
          state: 'CO',
          type: 'community',
          url: event.url,
          source: 'boulder_events',
        })),
        source: 'boulder_calendar',
      };
    } catch (err) {
      return { success: false, error: err.message, events: [] };
    }
  }

  /**
   * Arvada Parks & Recreation
   * Public calendar
   */
  static async arvadaEvents() {
    try {
      const response = await fetch('https://arvada.org/parks/calendar/', {
        timeout: 10000,
      });

      if (!response.ok) {
        return { success: false, error: `Arvada calendar ${response.status}`, events: [] };
      }

      // Would parse HTML here (use parser-real.js logic)
      // For now, return stub
      return {
        success: true,
        events: [],
        source: 'arvada_calendar',
      };
    } catch (err) {
      return { success: false, error: err.message, events: [] };
    }
  }

  /**
   * Parse ICS (iCalendar) format
   * Simple parser for common event fields
   */
  static parseICS(icsContent, city, state, source) {
    const events = [];
    const eventBlocks = icsContent.split('BEGIN:VEVENT');

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i];
      const endMatch = block.match(/END:VEVENT/);
      if (!endMatch) continue;

      const eventData = block.substring(0, endMatch.index);

      // Extract fields
      const summaryMatch = eventData.match(/SUMMARY:(.+)/);
      const dtStartMatch = eventData.match(/DTSTART(?::TZID=.+)?:(\d{8}T\d{6})/);
      const dtEndMatch = eventData.match(/DTEND(?::TZID=.+)?:(\d{8}T\d{6})/);
      const locationMatch = eventData.match(/LOCATION:(.+)/);

      if (summaryMatch && dtStartMatch) {
        const dateStr = dtStartMatch[1];
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = dateStr.substring(9, 11);
        const minute = dateStr.substring(11, 13);

        events.push({
          id: `${source}-${i}`,
          name: summaryMatch[1].trim(),
          date: `${year}-${month}-${day}`,
          time: `${hour}:${minute}`,
          venue: locationMatch ? locationMatch[1].trim() : 'TBD',
          city,
          state,
          type: 'public_event',
          source,
        });
      }
    }

    return events;
  }
}

/**
 * Master function: Fetch all Tier 2 events
 */
export async function fetchAllTier2Events(city, state, apiKeys = {}) {
  const results = {
    meetup: { events: [], error: null },
    eventbrite: { events: [], error: null },
    city_calendar: { events: [], error: null },
    total: 0,
  };

  // Meetup
  if (apiKeys.meetup) {
    const meetup = new MeetupAPI(apiKeys.meetup);
    const meetupResult = await meetup.searchEvents(city, state);
    results.meetup.events = meetupResult.events || [];
    results.meetup.error = meetupResult.error;
  }

  // Eventbrite
  if (apiKeys.eventbrite) {
    const eventbrite = new EventbriteAPI(apiKeys.eventbrite);
    const ebResult = await eventbrite.searchEvents(city, state);
    results.eventbrite.events = ebResult.events || [];
    results.eventbrite.error = ebResult.error;
  }

  // City calendars (all free, no keys needed)
  if (city.toLowerCase() === 'denver') {
    const denverResult = await CityCalendarAPI.denverEvents();
    results.city_calendar.events = denverResult.events || [];
    results.city_calendar.error = denverResult.error;
  } else if (city.toLowerCase() === 'boulder') {
    const boulderResult = await CityCalendarAPI.boulderEvents();
    results.city_calendar.events = boulderResult.events || [];
    results.city_calendar.error = boulderResult.error;
  } else if (city.toLowerCase() === 'arvada') {
    const arvadaResult = await CityCalendarAPI.arvadaEvents();
    results.city_calendar.events = arvadaResult.events || [];
    results.city_calendar.error = arvadaResult.error;
  }

  results.total = results.meetup.events.length + results.eventbrite.events.length + results.city_calendar.events.length;

  return results;
}

export default {
  MeetupAPI,
  EventbriteAPI,
  CityCalendarAPI,
  fetchAllTier2Events,
};
