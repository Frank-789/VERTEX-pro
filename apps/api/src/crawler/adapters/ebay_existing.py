"""eBay crawler adapter - wraps existing EbayDataTool from tools.ebay"""
import os
from typing import List
from .base import BaseCrawlerAdapter
from ..models import ProductRecord


class EbayCrawlerAdapter(BaseCrawlerAdapter):
    """Reuses the existing EbayDataTool from tools.ebay

    Does NOT modify tools/ebay.py or tools/registry.py.
    When EBAY_API_KEY is not configured, returns empty results (no mock data).
    """

    def __init__(self):
        self._tool = None

    def is_configured(self) -> bool:
        api_key = os.getenv("EBAY_API_KEY", "")
        return bool(api_key)

    def get_required_env(self) -> List[str]:
        return ["EBAY_API_KEY"]

    async def _get_tool(self):
        """Lazy-load the eBay tool to avoid import issues"""
        if self._tool is None:
            # Use the same mock-free mode by not passing API key if missing
            from tools.ebay import EbayDataTool
            self._tool = EbayDataTool()
            if not self.is_configured():
                self._tool.api_key = ""  # Clear any mock fallback
        return self._tool

    async def crawl(self, keyword: str, max_items: int = 20, **kwargs) -> List[ProductRecord]:
        if not self.is_configured():
            return []

        tool = await self._get_tool()
        try:
            products = await tool.search_products(keyword, max_items=max_items)
        except Exception:
            return []

        results = []
        for p in products:
            record = ProductRecord(
                platform="ebay",
                title=p.title,
                price=p.price,
                original_price=p.original_price,
                currency=p.currency or "USD",
                sales_volume=p.sales_volume,
                rating=p.rating,
                review_count=p.review_count,
                image_url=p.image_url,
                product_url=p.product_url,
                shop_name=p.shop_name,
                seller_name=p.seller_name,
                category=p.category,
                location=p.location,
                source="ebay_api",
                crawled_at=p.crawled_at,
            )
            results.append(record)

        return results
