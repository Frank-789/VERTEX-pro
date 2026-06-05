"""JD.com Data Tool - Using Playwright for data collection"""

import asyncio
import random
from typing import List, Optional, Dict, Any
from datetime import datetime
from .base import DataToolBase, ProductData, MarketOverview, format_price


class JDDataTool(DataToolBase):
    """JD.com product search & market data tool"""

    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None

    async def _ensure_browser(self):
        """Lazy init browser"""
        if self.browser is None:
            from playwright.async_api import async_playwright
            self._pw = await async_playwright().start()
            self.browser = await self._pw.chromium.launch(headless=True)
            self.context = await self.browser.new_context(
                user_agent=random.choice([
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ])
            )
            self.page = await self.context.new_page()

    async def search_products(self, keyword: str, max_items: int = 50, **kwargs) -> List[ProductData]:
        """Search JD.com products"""
        await self._ensure_browser()
        results = []

        try:
            search_url = f"https://search.jd.com/Search?keyword={keyword}&enc=utf-8"
            await self.page.goto(search_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)

            # Extract product cards
            items = await self.page.query_selector_all('.gl-item')
            count = 0
            for item in items:
                if count >= max_items:
                    break
                try:
                    title_el = await item.query_selector('.p-name a em')
                    price_el = await item.query_selector('.p-price i')
                    shop_el = await item.query_selector('.p-shop a')

                    title = await title_el.inner_text() if title_el else ""
                    price = await price_el.inner_text() if price_el else "0"

                    results.append(ProductData(
                        platform="jd",
                        title=title.strip(),
                        price=format_price(price),
                        currency="CNY",
                        shop_name=await shop_el.inner_text() if shop_el else None,
                        crawled_at=datetime.now().isoformat(),
                    ))
                    count += 1
                except Exception:
                    continue

        except Exception as e:
            print(f"[JD] 搜索失败: {e}")

        return results

    async def get_product_details(self, product_id: str) -> Optional[ProductData]:
        """Get JD product details"""
        # Placeholder - will be implemented with full detail page parsing
        return None

    async def get_market_overview(self, category: str, **kwargs) -> MarketOverview:
        """Get JD market overview"""
        results = await self.search_products(category, max_items=50)
        prices = [p.price for p in results if p.price > 0]

        overview = MarketOverview(
            platform="jd",
            category=category,
            total_products=len(results),
            price_min=min(prices) if prices else 0,
            price_max=max(prices) if prices else 0,
            price_avg=sum(prices)/len(prices) if prices else 0,
        )
        return overview

    async def close(self):
        """Clean up browser"""
        if self.browser:
            await self.browser.close()
        if hasattr(self, '_pw'):
            await self._pw.stop()

    async def health_check(self) -> bool:
        """Check if JD is accessible"""
        try:
            await self._ensure_browser()
            await self.page.goto("https://www.jd.com/", wait_until="domcontentloaded", timeout=15000)
            return True
        except Exception:
            return False
