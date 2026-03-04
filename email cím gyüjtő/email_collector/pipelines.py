import csv
import os
import re
from itemadapter import ItemAdapter

class EmailCollectorPipeline:
    def __init__(self):
        self.emails_seen = set()
        self.file = None
        self.writer = None

    def open_spider(self, spider):
        # We manually write to temp_emails.csv to avoid FeedExporter issues
        self.file = open('temp_emails.csv', 'w', newline='', encoding='utf-8')
        self.writer = csv.writer(self.file)
        # Write header matching items.py fields
        self.writer.writerow(['email', 'source_url', 'found_at', 'keyword'])

    def close_spider(self, spider):
        if self.file:
            self.file.close()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        email = adapter.get('email')
        
        if email:
            email = email.lower().strip()
            
            # Basic validation
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return None # Drop item
            
            # Check for Hungarian TLD (optional strict filter)
            # If you want ONLY .hu emails, uncomment the next lines:
            # if not email.endswith('.hu'):
            #    return None

            if email in self.emails_seen:
                return None # Drop duplicate
            
            self.emails_seen.add(email)
            adapter['email'] = email
            
            # Write row immediately
            if self.writer:
                self.writer.writerow([
                    adapter.get('email'),
                    adapter.get('source_url'),
                    adapter.get('found_at'),
                    adapter.get('keyword', '')
                ])
                # Flush to ensure data is written even if crash
                self.file.flush()

            return item
        else:
            return None
