/**
 * Email Configuration
 *
 * Sending limits, SMTP settings, and logging paths.
 * All credentials come from environment variables (never hardcoded).
 */

require('dotenv').config();

module.exports = {
  smtp: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,       // STARTTLS (not SSL-from-the-start)
    requireTLS: true,
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASSWORD
  },

  sender: {
    name: process.env.SENDER_NAME || 'Oliver Chase',
    email: process.env.OUTLOOK_USER,
    bcc: process.env.BCC_EMAIL
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
