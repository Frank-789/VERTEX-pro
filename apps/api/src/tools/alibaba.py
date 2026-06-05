"""1688.com Data Tool - Supply chain sourcing"""

import asyncio
import random
from typing import List, Optional
from datetime import datetime
from .base import DataToolBase, ProductData, MarketOverview, format_price


class AlibabaDataTool(DataToolBase):
    """1688.com (Alibaba) supply sourcing tool"""

    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None

    async def _ensure_browser(self):
        if self.browser is None:
            from playwright.async_api import async_playwright
            self._pw = await async_playwright().start()
            self.browser = await self._pw.chromium.launch(headless=True)
            self.context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            )
            self.page = await self.context.new_page()

    async def search_products(self, keyword: str, max_items: int = 50, **kwargs) -> List[ProductData]:
        """Search 1688 for supply chain products"""
        await self._ensure_browser()
        results = []

        try:
            search_url = f"https://s.1688.com/selloffer/offer_search.htm?keywords={keyword}"
            await self.page.goto(search_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(3)

            items = await self.page.query_selector_all('.offer-list-row .offer-item')
            count = 0
            for item in items:
                if count >= max_items:
                    break
                try:
                    title_el = await item.query_selector('.title')
                    price_el = await item.query_selector('.price')
                    company_el = await item.query_selector('.company-name')

                    title = await title_el.inner_text() if title_el else ""
                    price = await price_el.inner_text() if price_el else "0"

                    results.append(ProductData(
                        platform="1688",
                        title=title.strip(),
                        price=format_price(price),
                        currency="CNY",
                        seller_name=await company_el.inner_text() if company_el else None,
                        crawled_at=datetime.now().isoformat(),
                    ))
                    count += 1
                except Exception:
                    continue

        except Exception as e:
            print(f"[1688] 搜索失败: {e}")

        return results

    async def get_product_details(self, product_id: str) -> Optional[ProductData]:
        return None

    async def get_market_overview(self, category: str, **kwargs) -> MarketOverview:
        results = await self.search_products(category, max_items=50)
        prices = [p.price for p in results if p.price > 0]
        return MarketOverview(
            platform="1688",
            category=category,
            total_products=len(results),
            price_min=min(prices) if prices else 0,
            price_max=max(prices) if prices else 0,
            price_avg=sum(prices)/len(prices) if prices else 0,
        )

    async def close(self):
        if self.browser:
            await self.browser.close()
        if hasattr(self, '_pw'):
            await self._pw.stop()

    async def health_check(self) -> bool:
        try:
            await self._ensure_browser()
            await self.page.goto("https://www.1688.com/", wait_until="domcontentloaded", timeout=15000)
            return True
        except Exception:
            return False
