"""Amazon crawler adapter via Oxylabs API

Amazon 商品搜索支持：
- 关键词搜索：拼装 Amazon 搜索 URL，通过 universal 源抓取
- URL 抓取：直接传入 Amazon 商品页或搜索页 URL
- 商品详情：用 amazon_product source 按 ASIN 查
"""
import os
import re
import urllib.parse
from typing import List, Optional
from .base import BaseCrawlerAdapter
from ..models import ProductRecord


class OxylabsAmazonAdapter(BaseCrawlerAdapter):
    """Amazon product crawler via Oxylabs API"""

    def __init__(self):
        self._oxylabs_configured = False

    def is_configured(self) -> bool:
        username = os.getenv("OXYLABS_USERNAME", "")
        password = os.getenv("OXYLABS_PASSWORD", "")
        self._oxylabs_configured = bool(username and password)
        return self._oxylabs_configured

    def get_required_env(self) -> List[str]:
        return ["OXYLABS_USERNAME", "OXYLABS_PASSWORD"]

    async def _call_oxylabs(self, payload: dict) -> dict:
        import httpx
        username = os.getenv("OXYLABS_USERNAME", "")
        password = os.getenv("OXYLABS_PASSWORD", "")
        api_url = os.getenv("OXYLABS_API_URL", "https://realtime.oxylabs.io/v1/queries")
        payload.setdefault("parse", True)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                auth=(username, password),
                json=payload,
                timeout=60,
            )
            if response.status_code == 200:
                return response.json()
            return {}

    async def crawl(self, keyword: str, max_items: int = 20, **kwargs) -> List[ProductRecord]:
        if not self.is_configured():
            return []

        url = kwargs.get("url", "")

        if url:
            # Direct URL scraping
            raw = await self._call_oxylabs({
                "source": "universal",
                "url": url,
            })
        else:
            # Keyword search via Amazon search URL
            encoded = urllib.parse.quote(keyword)
            search_url = f"https://www.amazon.com/s?k={encoded}"
            raw = await self._call_oxylabs({
                "source": "universal",
                "url": search_url,
            })

        return self._parse_results(raw, keyword, max_items)

    def _parse_results(self, raw: dict, keyword: str, max_items: int) -> List[ProductRecord]:
        results = []

        if not raw:
            return results

        results_data = raw.get("results", [])
        if not results_data:
            return results

        first = results_data[0]
        content = first.get("content", "")
        parsed = first.get("parsed", {})
        status_code = first.get("status_code", 0)

        # Try structured parsing first
        if parsed and isinstance(parsed, dict):
            items = parsed.get("results", parsed.get("items", []))
            if items:
                for item in items[:max_items]:
                    rec = ProductRecord(
                        platform="amazon",
                        title=item.get("title", item.get("name", "")),
                        price=self._parse_price(item),
                        original_price=self._parse_original_price(item),
                        currency="USD",
                        sales_volume=item.get("sales", item.get("sales_volume")),
                        rating=float(item.get("rating", 0)) if item.get("rating") else None,
                        review_count=item.get("review_count", item.get("reviews_count")),
                        image_url=item.get("image_url", item.get("image")),
                        product_url=item.get("url", item.get("product_url")),
                        shop_name=item.get("shop_name", item.get("merchant")),
                        seller_name=item.get("seller", item.get("seller_name")),
                        category=item.get("category"),
                        source="oxylabs_amazon",
                        raw_data=item,
                    )
                    results.append(rec)

        # If no structured results but we have HTML, try basic extraction
        if not results and content and len(content) > 100:
            # Basic title extraction from HTML
            title_match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
            title = title_match.group(1).strip() if title_match else keyword

            # Price extraction
            price_match = re.search(r'\$\s*(\d+\.?\d*)', content)
            price = float(price_match.group(1)) if price_match else 0.0

            results.append(ProductRecord(
                platform="amazon",
                title=title[:200],
                price=price,
                currency="USD",
                source="oxylabs_amazon",
                raw_data={"content_preview": content[:2000], "status_code": status_code},
                parse_warning="已获取页面内容，但结构化解析待完善" if status_code == 200 else None,
            ))

        # Empty or error state
        if not results:
            results.append(ProductRecord(
                platform="amazon",
                title=keyword,
                price=0.0,
                currency="USD",
                source="oxylabs_amazon",
                raw_data={"status_code": status_code, "response_preview": str(raw)[:500]},
                parse_warning=(
                    "Oxylabs 返回了响应但未包含可解析的商品数据"
                    if status_code == 200
                    else f"请求返回状态码: {status_code}，可能受账号权限限制"
                ),
            ))

        return results

    def _parse_price(self, item: dict) -> float:
        for key in ["price", "sale_price", "current_price", "price_value"]:
            val = item.get(key)
            if val is not None:
                try:
                    return float(val)
                except (ValueError, TypeError):
                    pass
        # Try string price
        price_str = item.get("price_str", item.get("price_string", ""))
        if price_str:
            match = re.search(r'(\d+\.?\d*)', price_str.replace(",", ""))
            if match:
                return float(match.group(1))
        return 0.0

    def _parse_original_price(self, item: dict) -> Optional[float]:
        for key in ["original_price", "list_price", "was_price"]:
            val = item.get(key)
            if val is not None:
                try:
                    return float(val)
                except (ValueError, TypeError):
                    pass
        return None
