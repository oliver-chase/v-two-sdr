#!/usr/bin/env node
/**
 * Test Sheet Read — Verify Google Sheets connectivity
 * Uses API key or public access
 */

const { google } = require('googleapis');
const config = require('./config.sheets.js');

const SHEET_ID = config.google_sheets.sheet_id;
const API_KEY = process.env.GOOGLE_API_KEY || '';

async function testRead() {
  console.log('Testing Google Sheets read...');
  console.log('Sheet ID:', SHEET_ID);
  console.log('API Key configured:', API_KEY ? 'Yes' : 'No');
  
  try {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY || undefined });
    
    // Try to read the Leads tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Leads!A1:E5', // First 5 rows, first 5 columns
      key: API_KEY || undefined
    });
    
    console.log('✅ SUCCESS: Sheet is readable');
    console.log('Data rows:', response.data.values?.length || 0);
    console.log('Sample:', response.data.values?.slice(0, 3));
    
    return true;
  } catch (err) {
    console.log('❌ FAILED:', err.message);
    if (err.message.includes('API key')) {
      console.log('   Sheet may not be public or API key required');
    }
    if (err.message.includes('not found')) {
      console.log('   Sheet not found or no access');
    }
    return false;
  }
}

testRead();
