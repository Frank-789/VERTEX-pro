"""Base crawler adapter - abstract interface for all platforms"""
import os
from abc import ABC, abstractmethod
from typing import List, Optional
from ..models import ProductRecord


class BaseCrawlerAdapter(ABC):
    """Abstract base class for crawler adapters"""

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if required env vars are set"""
        ...

    @abstractmethod
    async def crawl(self, keyword: str, max_items: int = 20, **kwargs) -> List[ProductRecord]:
        """Execute a crawl and return results"""
        ...

    @abstractmethod
    def get_required_env(self) -> List[str]:
        """Return list of required env var names"""
        ...


class BaseOxylabsAdapter(BaseCrawlerAdapter):
    """Shared Oxylabs API logic for 1688, SHEIN, etc."""

    def __init__(self, source: str):
        self.source = source

    def is_configured(self) -> bool:
        username = os.getenv("OXYLABS_USERNAME", "")
        password = os.getenv("OXYLABS_PASSWORD", "")
        return bool(username and password)

    def get_required_env(self) -> List[str]:
        return ["OXYLABS_USERNAME", "OXYLABS_PASSWORD"]

    async def _call_oxylabs_api(self, url: str) -> Optional[dict]:
        """Make a real call to Oxylabs Realtime API"""
        import httpx

        username = os.getenv("OXYLABS_USERNAME", "")
        password = os.getenv("OXYLABS_PASSWORD", "")
        api_url = os.getenv("OXYLABS_API_URL", "https://realtime.oxylabs.io/v1/queries")

        payload = {
            "source": self.source,
            "url": url,
            "parse": True,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    api_url,
                    auth=(username, password),
                    json=payload,
                    timeout=60,
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"[Oxylabs] API error: {response.status_code} - {response.text[:200]}")
                    return None
        except Exception as e:
            print(f"[Oxylabs] Request failed: {e}")
            return None

    async def crawl(self, keyword: str, max_items: int = 20, **kwargs) -> List[ProductRecord]:
        if not self.is_configured():
            return []

        url = kwargs.get("url", "")
        if not url:
            url = self._build_search_url(keyword)

        raw_result = await self._call_oxylabs_api(url)
        if not raw_result:
            return []

        results = []
        try:
            content = raw_result.get("results", [{}])[0].get("content", "")
            parsed = raw_result.get("results", [{}])[0].get("parsed", {})

            if parsed and "results" in parsed:
                # Structured results available
                for item in parsed["results"][:max_items]:
                    record = ProductRecord(
                        platform=self._platform_name(),
                        title=item.get("title", ""),
                        price=float(item.get("price", 0) or 0),
                        original_price=float(item.get("original_price", 0)) if item.get("original_price") else None,
                        currency=item.get("currency", "CNY"),
                        sales_volume=item.get("sales", item.get("sales_volume")),
                        rating=float(item.get("rating", 0)) if item.get("rating") else None,
                        review_count=item.get("review_count", item.get("reviews_count")),
                        image_url=item.get("image_url", item.get("image")),
                        product_url=item.get("url", item.get("product_url")),
                        shop_name=item.get("shop_name", item.get("merchant")),
                        seller_name=item.get("seller_name", item.get("seller")),
                        category=item.get("category"),
                        source=f"oxylabs_{self.source}",
                        raw_data=item,
                    )
                    results.append(record)

            if not results and content:
                # Got HTML but couldn't parse
                record = ProductRecord(
                    platform=self._platform_name(),
                    title=keyword,
                    price=0.0,
                    source=f"oxylabs_{self.source}",
                    raw_data={"content_preview": content[:2000]},
                    parse_warning="已获取页面内容，但结构化解析待完善",
                )
                results.append(record)
        except Exception as e:
            # Return raw data with error note
            results.append(ProductRecord(
                platform=self._platform_name(),
                title=keyword,
                price=0.0,
                source=f"oxylabs_{self.source}",
                raw_data={"api_response": str(raw_result)[:2000]},
                parse_warning=f"解析响应时出错: {str(e)[:200]}",
            ))

        return results

    @abstractmethod
    def _build_search_url(self, keyword: str) -> str:
        ...

    @abstractmethod
    def _platform_name(self) -> str:
        ...
