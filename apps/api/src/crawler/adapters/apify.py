"""Apify extension platform adapter - placeholder for future Actor-based crawling"""
import os
from typing import List
from .base import BaseCrawlerAdapter
from ..models import ProductRecord


class ApifyAdapter(BaseCrawlerAdapter):
    """Apify Actor adapter - requires APIFY_TOKEN + APIFY_DEFAULT_ACTOR

    This is a configuration placeholder. When Apify credentials are configured,
    it can call Apify Actors for e-commerce scraping.
    Known e-commerce Actors include:
      - apify/web-scraper
      - jugo/amazon-scraper
      - miscer/shopee-scraper
      - ludwijkz/pinduoduo-scraper

    Note: Not all Actors work for all platforms - each needs separate evaluation.
    """

    def is_configured(self) -> bool:
        token = os.getenv("APIFY_TOKEN", "")
        return bool(token)

    def get_required_env(self) -> List[str]:
        return ["APIFY_TOKEN", "APIFY_DEFAULT_ACTOR"]

    async def crawl(self, keyword: str, max_items: int = 20, **kwargs) -> List[ProductRecord]:
        if not self.is_configured():
            return []

        token = os.getenv("APIFY_TOKEN", "")
        actor_id = os.getenv("APIFY_DEFAULT_ACTOR", "")

        if not actor_id:
            return [ProductRecord(
                platform="apify",
                title=keyword,
                price=0.0,
                source="apify",
                parse_warning="APIFY_DEFAULT_ACTOR 未配置，请指定要使用的 Apify Actor",
            )]

        # Placeholder: actual Apify API call would go here
        return [ProductRecord(
            platform="apify",
            title=keyword,
            price=0.0,
            source="apify",
            parse_warning=f"Apify Actor '{actor_id}' 调用能力待实现。请参考 Apify 文档配置具体 Actor。",
        )]
