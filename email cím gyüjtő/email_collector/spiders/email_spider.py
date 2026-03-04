import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule
from email_collector.items import EmailItem
import re

class EmailSpider(CrawlSpider):
    name = 'email_spider'
    
    def __init__(self, start_url=None, start_urls_list=None, email=None, password=None, search_keyword=None, *args, **kwargs):
        super(EmailSpider, self).__init__(*args, **kwargs)
        self.email = email
        self.password = password
        self.search_keyword = search_keyword or "Direkt URL / Ismeretlen"
        
        if start_urls_list:
            # Pass a comma separated string of URLs
            self.start_urls = start_urls_list.split(',')
        elif start_url:
            self.start_urls = [start_url]
        else:
            self.start_urls = ['https://www.startlap.hu']

    rules = (
        Rule(LinkExtractor(), callback='parse_item', follow=True),
    )

    def start_requests(self):
        # If credentials are provided, try to login first
        if self.email and self.password:
            self.logger.info(f"Attempting login with {self.email}")
            # Step 1: GET the login page to get the token
            yield scrapy.Request(
                url="https://www.companywall.hu/Belépés",
                callback=self.login
            )
        else:
            # Normal behavior
            for url in self.start_urls:
                yield scrapy.Request(url, callback=self.parse_item)

    def login(self, response):
        # Step 2: Extract token and POST
        token = response.css('input[name="__RequestVerificationToken"]::attr(value)').get()
        if not token:
            self.logger.error("Could not find CSRF token! Aborting login.")
            return

        yield scrapy.FormRequest.from_response(
            response,
            formdata={
                'Email': self.email,
                'Password': self.password,
                '__RequestVerificationToken': token,
                'returnUrl': '/Account/LogOff' # As seen in browser
            },
            callback=self.after_login
        )

    def after_login(self, response):
        if "Kijelentkezés" in response.text or "/profil" in response.text or response.status == 200:
             self.logger.info("Login successful (probably)!")
             # Navigate to the specific search query for Pest County (r=13)
             # Using the URL found by research
             search_url = "https://www.companywall.hu/keresés?r=13"
             yield scrapy.Request(search_url, callback=self.parse_companywall)
        else:
             self.logger.error("Login failed! Check credentials.")
             # Fallback to start_urls? Or stop? 
             # Let's try to crawl start_urls anyway as a fallback
             for url in self.start_urls:
                 yield scrapy.Request(url, callback=self.parse_item)

    def parse_companywall(self, response):
        self.logger.info(f"Parsing CompanyWall results: {response.url}")
        
        # 1. Find company links
        # Based on research, links are like /vállalat/NAME/HASH
        company_links = response.css('a[href^="/vállalat/"]::attr(href)').getall()
        self.logger.info(f"Found {len(company_links)} company links on page.")
        for link in company_links:
            yield response.follow(link, callback=self.parse_item)
            
        # 2. Pagination
        # Look for "next" page. 
        # Usually typical pagination structure.
        # Browser research showed pagination at bottom.
        # We'll look for simple Next button or numbered links
        next_page = response.css('li.next a::attr(href)').get()
        if not next_page:
            # Try generic "next" text or symbol
            next_page = response.xpath('//a[contains(text(), "Következő") or contains(text(), ">")]/@href').get()
            
        if next_page:
            yield response.follow(next_page, callback=self.parse_companywall)

    def parse_item(self, response):
        # We only want to look at text content
        # Simple regex for emails
        email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
        try:
            text_content = response.text
        except AttributeError:
            return # not text
            
        emails = re.findall(email_regex, text_content)
        
        for email in emails:
            # Basic filter to avoid garbage like 'image@2x.png' if regex matches it accidentally
            # and to focus on Hungarian context if needed.
            # Filtering common false positives
            if len(email) < 70 and not email.endswith(('.png', '.jpg', '.gif', '.css', '.js', '.svg', '.webp')):
                item = EmailItem()
                item['email'] = email
                item['source_url'] = response.url
                # Simple timestamp
                import datetime
                item['found_at'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                item['keyword'] = self.search_keyword
                yield item
