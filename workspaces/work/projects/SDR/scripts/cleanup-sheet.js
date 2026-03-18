#!/usr/bin/env node

/**
 * Clean up Google Sheets — remove empty rows
 *
 * Deletes empty rows from the "Leads" sheet using the Google Sheets API.
 * Useful after bulk operations to clean up formatting.
 *
 * Usage: node scripts/cleanup-sheet.js [--rows 5] [--from-row 241]
 *
 * Exit codes:
 *   0 = Success
 *   1 = Failure (error during processing)
 */

require('dotenv').config();
const { google } = require('googleapis');

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { numRows: 5, fromRow: 241 };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rows' && i + 1 < args.length) {
      result.numRows = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--from-row' && i + 1 < args.length) {
      result.fromRow = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return result;
}

/**
 * Delete rows from Google Sheet
 */
async function deleteRows(sheetId, sheetName, fromRow, numRows) {
  try {
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log(`[SDR] Getting sheet metadata...`);
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets(properties(sheetId,title))'
    });

    const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const sheetIdNum = sheet.properties.sheetId;

    // Delete rows using batchUpdate
    console.log(`[SDR] Deleting ${numRows} row(s) starting from row ${fromRow}...`);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetIdNum,
                dimension: 'ROWS',
                startIndex: fromRow - 1, // 0-indexed
                endIndex: fromRow - 1 + numRows
              }
            }
          }
        ]
      }
    });

    console.log(`[SDR] ✅ Successfully deleted ${numRows} row(s)`);
    return { success: true, deleted: numRows };
  } catch (error) {
    console.error(`[SDR] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  if (!process.env.GOOGLE_SHEET_ID) {
    console.error('[SDR] GOOGLE_SHEET_ID not set in environment');
    process.exit(1);
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('[SDR] Service account credentials not set');
    process.exit(1);
  }

  const result = await deleteRows(
    process.env.GOOGLE_SHEET_ID,
    process.env.GOOGLE_SHEET_NAME || 'Leads',
    args.fromRow,
    args.numRows
  );

  if (!result.success) {
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { deleteRows };
