#!/usr/bin/env python3
"""
V.Two SDR Email Automation
Reads from Google Sheet, sends emails via Outlook SMTP, logs results

Setup:
1. Google Cloud API key (see setup-instructions.md)
2. Outlook SMTP credentials (oliver@vtwo.co)
3. Environment variables: GOOGLE_API_KEY, OUTLOOK_PASSWORD
"""

import smtplib
import os
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from zoneinfo import ZoneInfo
import json
import base64
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# Configuration
OUTLOOK_EMAIL = "oliver@vtwo.co"
OUTLOOK_PASSWORD = os.getenv("OUTLOOK_PASSWORD")  # From env, not hardcoded
SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

KIANA_EMAIL = "kiana.micari@vtwo.co"

# Google Sheets API
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SHEET_NAME = "Master Lead Repository"
GOOGLE_API_KEY_B64 = os.getenv("GOOGLE_API_KEY")  # Base64-encoded JSON

class SDRAutomation:
    def __init__(self):
        self.sent_count = 0
        self.failed_count = 0
        self.logs = []
        self.sheet = self._init_sheet()

    def _init_sheet(self):
        """Initialize Google Sheets API client."""
        try:
            # Decode base64 API key
            api_key_json = base64.b64decode(GOOGLE_API_KEY_B64).decode('utf-8')
            creds_dict = json.loads(api_key_json)

            # Authenticate
            scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
            client = gspread.authorize(creds)

            # Open sheet
            sheet = client.open_by_key(SHEET_ID)
            return sheet.worksheet(SHEET_NAME)

        except Exception as e:
            print(f"Failed to initialize Google Sheets: {e}")
            return None

    def read_google_sheet(self):
        """
        Reads Master Lead Repository from Google Sheet.
        Returns list of prospects with Status = 'ready-to-send', 'contacted', or 'follow-up-X'
        and Next Follow-Up Date = today.
        """
        if not self.sheet:
            print("Google Sheet not initialized")
            return []

        try:
            all_records = self.sheet.get_all_records()
            today = datetime.now().strftime("%Y-%m-%d")

            # Filter: Status = ready-to-send/contacted/follow-up-X AND Next Follow-Up Date = today
            due_prospects = [
                record for record in all_records
                if record.get("Status") in ["ready-to-send", "contacted", "follow-up-1", "follow-up-2", "follow-up-3"]
                and record.get("Next Follow-Up") == today
            ]

            return due_prospects

        except Exception as e:
            print(f"Failed to read Google Sheet: {e}")
            return []

    def get_local_send_time(self, timezone_str, base_hour=9):
        """
        Converts ET send time to prospect's local timezone.
        
        Args:
            timezone_str: Timezone like "America/New_York", "America/Los_Angeles"
            base_hour: Hour in ET (default 9 AM)
        
        Returns:
            Local send time (datetime)
        """
        et = ZoneInfo("America/New_York")
        local_tz = ZoneInfo(timezone_str)
        
        now_et = datetime.now(et)
        send_time_et = now_et.replace(hour=base_hour, minute=0, second=0, microsecond=0)
        send_time_local = send_time_et.astimezone(local_tz)
        
        return send_time_local

    def should_send_today(self, prospect, current_time):
        """
        Checks if prospect should be sent today based on:
        - Next Follow-Up Date = today
        - Local send time is within business hours (9 AM - 5 PM)
        - Day of week is Tue-Thu (or configured)
        
        Returns: Boolean
        """
        next_followup = prospect.get("Next Follow-Up Date")
        if next_followup != current_time.strftime("%Y-%m-%d"):
            return False
        
        local_send_time = self.get_local_send_time(prospect.get("Timezone", "America/New_York"))
        if local_send_time.hour < 9 or local_send_time.hour > 17:
            return False
        
        # Tue=1, Wed=2, Thu=3, Fri=4, Mon=0
        if local_send_time.weekday() not in [1, 2, 3]:  # Tue, Wed, Thu
            return False
        
        return True

    def send_email(self, prospect, template_content):
        """
        Sends email via Outlook SMTP.
        
        Args:
            prospect: Dict with name, email, company, template, subject
            template_content: Full email body text
        
        Returns: Boolean (success/failure)
        """
        try:
            msg = MIMEMultipart()
            msg["From"] = OUTLOOK_EMAIL
            msg["To"] = prospect["Email"]
            msg["Subject"] = prospect["Subject"]
            
            msg.attach(MIMEText(template_content, "plain"))
            
            # Connect to Outlook
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(OUTLOOK_EMAIL, OUTLOOK_PASSWORD)
            
            # Send email
            server.send_message(msg)
            server.quit()
            
            self.sent_count += 1
            self.logs.append({
                "status": "sent",
                "prospect": prospect["Name"],
                "company": prospect["Company"],
                "email": prospect["Email"],
                "template": prospect.get("Template", "unknown"),
                "timestamp": datetime.now().isoformat(),
            })
            
            return True
        
        except Exception as e:
            self.failed_count += 1
            self.logs.append({
                "status": "failed",
                "prospect": prospect["Name"],
                "company": prospect["Company"],
                "email": prospect["Email"],
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            })
            
            return False

    def update_sheet_status(self, prospect_email, new_status, next_followup_date):
        """
        Updates Master Lead Repository with new status + next follow-up date.
        Finds prospect by email and updates Status + Next Follow-Up columns.
        """
        if not self.sheet:
            print("Google Sheet not initialized")
            return False

        try:
            # Find row by email
            cell = self.sheet.find(prospect_email)
            if not cell:
                print(f"Prospect email {prospect_email} not found in sheet")
                return False

            row = cell.row

            # Update Status (column M) and Next Follow-Up (column R)
            self.sheet.update_cell(row, 13, new_status)  # Column M = Status
            self.sheet.update_cell(row, 18, next_followup_date)  # Column R = Next Follow-Up

            return True

        except Exception as e:
            print(f"Failed to update sheet status: {e}")
            return False

    def send_summary_to_kiana(self):
        """
        Sends daily summary email to Kiana.
        """
        summary = f"""
Daily SDR Outreach Summary
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Sent: {self.sent_count}
Failed: {self.failed_count}

Details:
{json.dumps(self.logs, indent=2)}
"""
        
        try:
            msg = MIMEText(summary, "plain")
            msg["From"] = OUTLOOK_EMAIL
            msg["To"] = KIANA_EMAIL
            msg["Subject"] = f"[SDR] Daily Outreach Summary - {datetime.now().strftime('%Y-%m-%d')}"
            
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(OUTLOOK_EMAIL, OUTLOOK_PASSWORD)
            server.send_message(msg)
            server.quit()
        
        except Exception as e:
            print(f"Failed to send summary: {e}")

    def run(self):
        """
        Main execution: read sheet → filter due sends → send emails → update sheet → send summary
        """
        print("SDR Automation starting...")

        # Read prospects from Google Sheet
        prospects = self.read_google_sheet()

        if not prospects:
            print("No prospects due for outreach today.")
            self.send_summary_to_kiana()  # Still send summary
            return

        current_time = datetime.now()

        # Process each prospect
        for prospect in prospects:
            if not self.should_send_today(prospect, current_time):
                continue

            # Prepare email
            prospect_name = prospect.get("Name", "")
            prospect_email = prospect.get("Email", "")
            prospect_company = prospect.get("Company", "")
            current_status = prospect.get("Status", "")

            # Generate template subject + content
            subject = self._generate_subject(prospect)
            content = self._generate_email_body(prospect)

            email_data = {
                "Name": prospect_name,
                "Email": prospect_email,
                "Company": prospect_company,
                "Subject": subject,
            }

            # Send email
            if self.send_email(email_data, content):
                # Update status in sheet
                new_status = self._get_next_status(current_status)
                next_followup = self._calculate_next_followup(current_status)
                self.update_sheet_status(prospect_email, new_status, next_followup)

        # Send summary to Kiana
        self.send_summary_to_kiana()

        print(f"Done. Sent: {self.sent_count}, Failed: {self.failed_count}")

    def _generate_subject(self, prospect):
        """Generate email subject based on template and prospect data."""
        title = prospect.get("Title", "")
        company = prospect.get("Company", "")
        status = prospect.get("Status", "")

        # Different subjects by status
        if status == "contacted":
            return f"{company}'s platform architecture"
        elif status == "follow-up-1":
            return f"Re: {company}'s platform architecture"
        elif status == "follow-up-2":
            return f"Re: {company}'s platform architecture (case study)"
        elif status == "follow-up-3":
            return f"Last note—{prospect.get('Name', 'there')}"
        else:
            return f"Quick question about {company}"

    def _generate_email_body(self, prospect):
        """Generate email body based on template and prospect data."""
        name = prospect.get("Name", "there")
        company = prospect.get("Company", "")
        title = prospect.get("Title", "")
        status = prospect.get("Status", "")

        # Template by status (simplified; can expand with more variants)
        if status == "contacted":
            return f"""Hi {name},

I've been following {company}'s work on platform modernization.

At V.Two, we partner with mid-market companies to accelerate product delivery—standing up teams, embedding senior engineers, or modernizing platforms end-to-end. We've seen themes like custom marketplace rebuilds come up repeatedly, and I thought it might be worth exploring.

Open to a quick 15-min chat?

Best,
Oliver
V.Two"""

        elif status == "follow-up-1":
            return f"""Hi {name},

Just circling back in case it got buried.

Happy to chat if platform acceleration is on your roadmap.

Oliver"""

        elif status == "follow-up-2":
            return f"""Hi {name},

Wanted to share a case study that might be relevant—we recently rebuilt a marketplace platform for a Series B company, cutting deployment time significantly.

If you're exploring similar efficiency gains, worth a quick call.

Oliver"""

        else:  # follow-up-3
            return f"""Hi {name},

Not sure if you've been heads-down, but wanted to flag this before I move on.

We specialize in exactly this kind of work. Worth 15 min?

Oliver"""

    def _get_next_status(self, current_status):
        """Maps current status to next status."""
        status_flow = {
            "new": "contacted",
            "contacted": "follow-up-1",
            "follow-up-1": "follow-up-2",
            "follow-up-2": "follow-up-3",
            "follow-up-3": "no-response",
        }
        return status_flow.get(current_status, current_status)

    def _calculate_next_followup(self, current_status):
        """Calculates next follow-up date (5–7 days later)."""
        return (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")

if __name__ == "__main__":
    automation = SDRAutomation()
    automation.run()
