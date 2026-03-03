#!/usr/bin/env python3
"""
Quick script to enrich Kiana's row in Master Lead Repository with all required data.
Then ready-to-send with Next Follow-Up = today.
"""

import os
import base64
import json
from datetime import datetime

try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
except ImportError:
    print("ERROR: Missing dependencies. Run: pip install gspread oauth2client")
    exit(1)

# Configuration
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_API_KEY_B64 = os.getenv("GOOGLE_API_KEY")
SHEET_NAME = "Master Lead Repository"
KIANA_ROW = 2  # Row 2 (1-indexed in Google Sheets)

# Enriched data for Kiana (columns A-Z, 1-indexed)
KIANA_DATA = {
    1: "Kiana Micari",                                      # A: Name
    2: "VP Strategic Growth",                               # B: Title
    3: "V.Two",                                             # C: Company
    4: "kiana.micari@vtwo.co",                             # D: Email
    5: "Y",                                                 # E: Email Validated
    6: "Rochester, NY",                                     # F: Location
    7: "America/New_York",                                  # G: Timezone
    8: "https://www.linkedin.com/in/kiana-micari/",        # H: LinkedIn
    9: "100-250",                                           # I: Company Size
    10: "SaaS",                                             # J: Industry
    11: "Private/Bootstrapped",                             # K: Funding
    12: "Internal Test Lead",                               # L: Signal Source
    13: "Internal Practice Test",                           # M: Signal Link
    14: "ready-to-send",                                    # N: Status
    15: datetime.now().strftime("%Y-%m-%d"),               # O: Date Added
    16: "",                                                 # P: First Contact
    17: "",                                                 # Q: Last Contact
    18: "0",                                                # R: Follow-Up Count
    19: datetime.now().strftime("%Y-%m-%d"),               # S: Next Follow-Up
    20: "none",                                             # T: Response Status
    21: "",                                                 # U: Response Date
    22: "",                                                 # V: Response Notes
    23: "VP Strategic Growth - Test",                       # W: Template Used
    24: "10-11 AM Tue-Thu",                                 # X: Send Time (Optimal)
    25: "Day 6, 12, 18",                                    # Y: Follow-Up Schedule
    26: "Internal test lead. Will send immediately to practice workflow.", # Z: Internal Notes
}

def main():
    try:
        # Decode and load credentials
        if not GOOGLE_API_KEY_B64 or not SHEET_ID:
            print("ERROR: Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID env vars")
            return False

        api_key_json = base64.b64decode(GOOGLE_API_KEY_B64).decode('utf-8')
        creds_dict = json.loads(api_key_json)

        # Authenticate
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)

        # Open sheet
        sheet = client.open_by_key(SHEET_ID)
        ws = sheet.worksheet(SHEET_NAME)

        # Update Kiana's row (row 2) with enriched data
        print(f"\nUpdating Kiana's row ({KIANA_ROW})...\n")

        for col, value in KIANA_DATA.items():
            ws.update_cell(KIANA_ROW, col, value)
            col_letter = chr(64 + col)  # Convert to column letter (A, B, C, etc.)
            print(f"  {col_letter}{KIANA_ROW}: {value}")

        print(f"\n✓ Kiana's row fully enriched and ready for send")
        print(f"  Status: ready-to-send")
        print(f"  Next Follow-Up: {datetime.now().strftime('%Y-%m-%d')} (today)")
        print(f"  Email: kiana.micari@vtwo.co")
        print(f"  Template: VP Strategic Growth - Test")
        return True

    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
