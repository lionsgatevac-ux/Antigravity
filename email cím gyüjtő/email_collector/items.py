import scrapy

class EmailItem(scrapy.Item):
    email = scrapy.Field()
    source_url = scrapy.Field()
    found_at = scrapy.Field()
    keyword = scrapy.Field()
