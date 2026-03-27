/**
 * Email Configuration
 *
 * Sending limits, sender info, and logging paths.
 * OAuth credentials are loaded separately via config.oauth.js
 * All credentials come from environment variables (never hardcoded).
 */

require('dotenv').config();

module.exports = {
  sender: {
    name: process.env.SENDER_NAME || 'Oliver Chase',
    email: 'oliver@vtwo.co',
    bcc: process.env.BCC_EMAIL || 'kiana.micari@vtwo.co'
  },

  limits: {
    maxDaily: parseInt(process.env.MAX_DAILY_SENDS || '15'),
    delayMs: parseInt(process.env.SEND_DELAY_MS || '30000')
  },

  paths: {
    sendsLog: './outreach/sends.json',
    optOuts: './outreach/opt-outs.json'
  }
};
