# FALLOW UX Insights & User Journey

**Core user flows:**
1. **Add venue** → name, location, URL → auto-dedup → save
2. **Browse events** → search + filters → select → view details → favorite/save
3. **Compile** → favorites collection → export to iCal
4. **Configure** → set home location + radius (optional future phase)

**Critical decisions:**
- **Current:** Filter by city (discrete) - adequate for MVP
- **Future:** User-configured location + radius (mi/km) for proximity-based filtering
- **Data:** Favorites stored in localStorage (MVP) → user accounts + database persistence (Phase 4)
- **Mobile-first:** calendar picker for date range (replace buttons) - priority usability

**Database-first mentality:** star/save should be persisted, not ephemeral. Current localStorage is temporary MVP storage; migration plan: add `users` collection with `favorites` array field.

**Next: EventDetail page** - must include iCal export and clear venue context.