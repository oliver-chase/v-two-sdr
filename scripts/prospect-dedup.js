'use strict';

/**
 * scripts/prospect-dedup.js — Prospect deduplication utilities
 * Used by prospect.js. Not imported elsewhere.
 */

const fs = require('fs');
const path = require('path');

const PROSPECTS_FILE = path.join(__dirname, '..', 'prospects.json');

function loadLocalProspects() {
  try {
    if (fs.existsSync(PROSPECTS_FILE)) {
      var data = JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
      return Array.isArray(data.prospects) ? data.prospects : [];
    }
  } catch (e) {
    console.warn('[prospect] Could not load prospects.json: ' + e.message);
  }
  return [];
}

/**
 * Extract the three dedup keys from a prospect object.
 * Handles both nm (full name) and fn+ln (split name) formats.
 */
function extractDedupKeys(p) {
  var email = (p.em || '').toLowerCase().trim();
  var fullName = p.nm
    ? p.nm.trim()
    : ((p.fn || '') + ' ' + (p.ln || '')).trim();
  var nameCompany = fullName.toLowerCase() + '|' + (p.co || '').toLowerCase().trim();
  var firstName = p.fn
    ? p.fn.toLowerCase().trim()
    : fullName.toLowerCase().split(/\s+/)[0] || '';
  var domainFirst = (p.dm || '').toLowerCase().trim() + '|' + firstName;
  return { email, nameCompany, domainFirst };
}

/**
 * Build a three-key dedup index from an array of prospects.
 * Returns { emails, nameCompanies, domainFirstNames } — all Sets.
 */
function buildDedupIndex(prospects) {
  var emails = new Set();
  var nameCompanies = new Set();
  var domainFirstNames = new Set();
  prospects.forEach(function (p) {
    var k = extractDedupKeys(p);
    if (k.email) emails.add(k.email);
    if (k.nameCompany && k.nameCompany !== '|') nameCompanies.add(k.nameCompany);
    if (k.domainFirst && k.domainFirst !== '|') domainFirstNames.add(k.domainFirst);
  });
  return { emails, nameCompanies, domainFirstNames };
}

/**
 * Return true if candidate matches any key in the given index.
 */
function matchesIndex(candidate, index) {
  var k = extractDedupKeys(candidate);
  if (k.email && index.emails.has(k.email)) return true;
  if (k.nameCompany && k.nameCompany !== '|' && index.nameCompanies.has(k.nameCompany)) return true;
  if (k.domainFirst && k.domainFirst !== '|' && index.domainFirstNames.has(k.domainFirst)) return true;
  return false;
}

module.exports = { loadLocalProspects, extractDedupKeys, buildDedupIndex, matchesIndex };
