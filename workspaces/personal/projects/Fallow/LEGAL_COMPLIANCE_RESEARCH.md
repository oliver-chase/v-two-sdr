# Event Discovery Platform — Legal Compliance Blueprint

## Jurisdiction & Scope
- **Primary:** Colorado
- **Secondary:** Wyoming (events near CO borders)
- **Focus:** Public event data aggregation (metadata only, no ticketing/transactions)

---

## 1. Legal Framework Analysis

### Federal Law: Computer Fraud & Abuse Act (CFAA)

**Status:** Monitored (not direct threat to metadata aggregation)

**Safe practices:**
- ✅ Accessing public URLs (no authentication bypass)
- ✅ Respecting robots.txt (not required, but best practice)
- ✅ Rate limiting (avoiding DoS-like behavior)
- ✅ Metadata only (event name, date, location, public links)

**Risky practices (avoid):**
- ❌ Scraping behind paywalls or login walls
- ❌ Circumventing access controls
- ❌ High-volume automated requests that degrade service
- ❌ Extracting transactional data (ticket prices, user accounts)

**Conclusion:** CFAA is **not a blocker** for public metadata aggregation if done respectfully.

---

### State Law: Colorado

#### CRS § 6-1-101 (Colorado Deceptive Trade Practices Act)
- Prohibits unfair/deceptive practices in commerce
- **Impact:** Platform must be honest about data sources and use
- **Compliance:** Disclose where data comes from; don't misrepresent events

#### CRS § 18-4-308 (Unauthorized Computer Access)
- Similar to CFAA but state-level
- **Impact:** Same as federal; public data aggregation OK
- **Compliance:** Don't access non-public systems

#### CRS § 6-1-701 (Consumer Data Privacy)
- Colorado Privacy Act (CPA) — applies to personal data
- **Impact:** Event submissions from users need privacy policy
- **Compliance:** If collecting user submissions, disclose use; allow deletion requests

**Colorado-specific risk:** LOW. Public event data is not "personal data" under CPA unless linked to identifiable individuals.

---

### Intellectual Property: Copyright & Fair Use

**Question:** Is aggregating event metadata infringing?

**Analysis:**

Event metadata = {name, date, time, location, description, URL}

**Copyright status:**
- Event names: Not copyrightable (facts, titles are ideas)
- Descriptions: May be copyrightable if original/creative
- Dates/times: Not copyrightable (facts)
- Public URLs: Not copyrightable

**Fair Use doctrine (17 U.S.C. § 107):**
- Purpose: Transformative (discovery engine ≠ reproduction)
- Nature: Short metadata snippets, not full content
- Amount: Minimal (essentials only)
- Market effect: Actually helps organizers (drives traffic)

**Conclusion:** Metadata aggregation is **likely safe under fair use**. Including brief descriptions is OK; don't reproduce full event pages.

---

## 2. Source-by-Source Analysis

### Tier 1: Safe (City & Government Sources)

#### City of Denver Event Calendar
- **URL:** denverco.gov/events
- **Data:** Public sector, no paywall, no login required
- **ToS:** City data typically public domain or CC0
- **Monitoring:** ✅ **SAFE TO SCRAPE**
- **Method:** Direct website monitoring, possibly API if available
- **Rate limit:** Respectful (1-2 checks/day)

#### City of Boulder Event Calendar
- **URL:** bouldercolorado.gov
- **Data:** Public, no auth required
- **ToS:** Public sector
- **Monitoring:** ✅ **SAFE TO SCRAPE**
- **Rate limit:** 1-2 checks/day

#### Colorado Parks & Recreation / Outdoor Events
- **URL:** parks.state.co.us
- **Data:** Public, no paywall
- **ToS:** Public sector
- **Monitoring:** ✅ **SAFE TO SCRAPE**

**Action:** Prioritize city websites as primary source. Lowest legal risk.

---

### Tier 2: Caution (Event Platforms & APIs)

#### Eventbrite
- **URL:** eventbrite.com
- **ToS:** Explicit scrapers forbidden ("you may not crawl or scrape")
- **API:** Free tier available for public event data
- **Monitoring:** ✅ **API ONLY** (no scraping)
- **Method:** Eventbrite Public API (REST, auth-free for public data)
- **Rate limit:** 300 requests/min (more than enough)
- **Data:** Event name, date, location, description, RSVP count

**Action:** Use Eventbrite API, not scraper. Register for free API access.

---

### Tier 3: Caution (Social Media & Venue Sites)

#### Facebook Events
- **URL:** facebook.com/events
- **ToS:** Explicit prohibition on crawling
- **API:** Limited by Meta's policies; event data requires app approval
- **Monitoring:** ⚠️ **API WITH RESTRICTIONS**
- **Method:** Facebook Conversions API or manual monitoring of known pages
- **Risk:** Meta actively blocks bots; API access requires app review

**Action:** Don't scrape Facebook directly. Monitor known venues' Facebook pages manually or via RSS if available.

#### Instagram
- **ToS:** Prohibits scraping
- **Data:** Event info often in captions, stories (ephemeral)
- **API:** No public event API
- **Monitoring:** ❌ **NOT RECOMMENDED FOR AUTOMATED SCRAPING**
- **Alternative:** Manual flagging system for users to submit Instagram event links

**Action:** User submission form for Instagram events; don't auto-scrape.

#### Venue Websites (Breweries, Concert Halls, etc.)
- **Examples:** New Terrain Brewing, Arvada venues
- **ToS:** Varies; most don't explicitly forbid public data aggregation
- **robots.txt:** Check individually
- **Monitoring:** ✅ **SAFE IF RESPECTFUL**
- **Method:** Respectful scraping (follow robots.txt, rate-limit, user-agent)
- **Rate limit:** 1 check per venue per week

**Action:** Monitor venue sites directly, but respectfully (rate-limit, user-agent, follow robots.txt).

---

### Tier 4: User Submissions (No Legal Risk)

#### User-Submitted Events
- **Data:** User provides link, event details
- **Legal:** ✅ **ZERO LEGAL RISK** (user is the source)
- **Privacy:** Requires submission form + privacy policy
- **Compliance:** Disclose usage; allow deletion; don't sell data

**Action:** Build submission form; require user to confirm they're providing public info.

---

## 3. Legal Compliance Strategy

### Permitted Data Sources (No Legal Controversy)

1. **City event calendars** (Denver, Boulder, Arvada, etc.) — 100% safe
2. **Eventbrite API** (public data only) — 100% safe, API-approved
3. **User submissions** — 100% safe, user-provided
4. **Venue websites** (with rate-limiting & robots.txt respect) — ~95% safe
5. **Local news / press releases** (fair use, minimal excerpt) — ~90% safe

### Forbidden / High-Risk

- ❌ Facebook/Instagram scraping (violates ToS)
- ❌ Ticketing system data (transactional, proprietary)
- ❌ User account data (privacy, CCPA)
- ❌ High-volume requests that degrade service (CFAA risk)

---

## 4. Data Handling & Privacy

### User Submission Policy

If collecting user-submitted events:

**Required:**
- Privacy policy (what data we collect, how we use it, how to delete)
- Explicit consent ("I confirm this is public event information")
- Right to deletion (allow users to remove submissions)
- No resale of data

**Recommended:**
- Terms of use (user responsible for accuracy/copyright)
- Moderation process (flag suspicious submissions)
- Attribution (credit user or event source)

### Colorado Privacy Act (CPA) Compliance

**Question:** Does event metadata trigger CPA?

**Answer:** Likely NO, unless:
- Linked to identifiable person (person's schedule, preferences)
- Collected as part of profiling system

**If user logs in:** YES, apply CPA (data deletion rights, opt-out, etc.)

**Conclusion:** Public event metadata is safe; user accounts require privacy compliance.

---

## 5. Recommended Architecture

### Data Acquisition (Legally Sound)

```
Tier 1 (Daily) — City websites
  └─ Denver.gov events
  └─ Boulder.gov events
  └─ Arvada.gov events
  
Tier 2 (Daily) — Eventbrite API
  └─ Query: location=Denver, date_range=2026
  
Tier 3 (Weekly) — Venue sites (rate-limited)
  └─ New Terrain Brewing
  └─ Arvada venues
  └─ Concert venues
  
Tier 4 (Manual) — User submissions
  └─ Web form + verification
```

### Rate Limiting & Ethical Behavior

- **City sites:** 1-2 checks/day (minimal load)
- **Eventbrite API:** Use official API, respect rate limits (300/min)
- **Venue sites:** 1 check/week per venue, respectful user-agent
- **Delay between requests:** 2-5 seconds (no hammering)
- **robots.txt:** Always respect
- **User-Agent header:** Identify as "EventDiscovery/1.0 (+contact@platform.com)"

---

## 6. Terms of Use & Disclaimers

### Platform ToS Should Include

1. **Data Source Disclosure**
   - "We aggregate event data from city websites, Eventbrite API, venue websites, and user submissions"

2. **Accuracy Disclaimer**
   - "We attempt to maintain accuracy but cannot guarantee all information is current. Always verify with the source."

3. **No Ticketing/Transactions**
   - "We do not sell tickets or process payments. Links direct to official sources."

4. **Fair Use**
   - "We use event metadata under fair use principles for discovery and curation."

5. **User Submissions**
   - "Users retain responsibility for accuracy and copyright of submitted information."

---

## 7. Legal Risk Assessment

| Activity | Risk Level | Mitigation |
|----------|-----------|-----------|
| City website monitoring | 🟢 Low | Respectful rate-limiting, robots.txt |
| Eventbrite API | 🟢 Low | Use official API, follow ToS |
| Venue website monitoring | 🟢 Low | Rate-limit (1/week), robots.txt, user-agent |
| User submissions | 🟢 Low | Privacy policy, consent, deletion rights |
| Facebook scraping | 🔴 High | **DON'T DO** — use API only |
| Instagram scraping | 🔴 High | **DON'T DO** — user submissions only |
| Ticketing data | 🔴 High | **DON'T DO** — not our data |

---

## 8. Recommended Legal Actions

### Before MVP Launch

- [ ] Draft privacy policy (if accepting user submissions)
- [ ] Draft terms of use (data sources, fair use, accuracy disclaimer)
- [ ] Document all data sources and scraping methods
- [ ] Register Eventbrite API credentials
- [ ] Document robots.txt compliance for each venue source
- [ ] Set up rate-limiting to avoid service degradation

### Before Scale

- [ ] Consult Colorado data privacy attorney (for CPA compliance if adding accounts)
- [ ] Review CFAA implications with legal (though low-risk)
- [ ] Consider insurance for platform liability
- [ ] Establish takedown/removal policy for copyright concerns

---

## 9. Conclusion

**LEGAL CLEARANCE: YES, with conditions**

**Safe to build:**
- ✅ Metadata aggregation from public sources (city sites, Eventbrite API, venue sites)
- ✅ User submission system
- ✅ Persistent event memory (archival model)
- ✅ Recurrence detection and monitoring

**Not safe:**
- ❌ Facebook/Instagram scraping
- ❌ Transactional data (tickets, pricing)
- ❌ User account data without privacy infrastructure

**Risk level:** LOW if built as documented. Go with Tier 1 + Tier 2 sources first.

---

## Next Steps

1. Build MVP with city website + Eventbrite API data
2. Implement respectful venue site monitoring (weekly, rate-limited)
3. Create user submission form with privacy policy
4. Document all data sources in codebase
5. Ship MVP for CO events only
6. Gather legal feedback before scaling to multi-state

