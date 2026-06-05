"""eBay Data Tool - Using eBay Browse API"""

import os
from typing import List, Optional
from datetime import datetime
import httpx
from .base import DataToolBase, ProductData, MarketOverview, format_price


class EbayDataTool(DataToolBase):
    """eBay product search via Browse API"""

    def __init__(self):
        self.api_key = os.getenv("EBAY_API_KEY", "")
        self.base_url = "https://api.ebay.com/buy/browse/v1"

    async def search_products(self, keyword: str, max_items: int = 50, **kwargs) -> List[ProductData]:
        """Search eBay products via Browse API"""
        results = []

        if not self.api_key:
            # Fallback: return mock data for testing
            return self._mock_search(keyword, max_items)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/item_summary/search",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
                    },
                    params={
                        "q": keyword,
                        "limit": min(max_items, 50),
                    },
                    timeout=15,
                )

                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("itemSummaries", []):
                        results.append(ProductData(
                            platform="ebay",
                            title=item.get("title", ""),
                            price=format_price(item.get("price", {}).get("value", "0")),
                            currency=item.get("price", {}).get("currency", "USD"),
                            sales_volume=item.get("bidCount"),
                            image_url=item.get("image", {}).get("imageUrl"),
                            product_url=item.get("itemWebUrl"),
                            seller_name=item.get("seller", {}).get("username"),
                            crawled_at=datetime.now().isoformat(),
                        ))
        except Exception as e:
            print(f"[eBay] API错误: {e}")

        return results

    def _mock_search(self, keyword: str, max_items: int) -> List[ProductData]:
        """Mock data for development/testing"""
        import random
        mock_titles = [
            f"Premium {keyword} - Professional Grade",
            f"{keyword} Starter Kit with Accessories",
            f"New {keyword} 2024 Model - High Quality",
            f"{keyword} Bundle - Best Value Pack",
            f"Professional {keyword} Set for Experts",
            f"Eco-friendly {keyword} - Sustainable Choice",
            f"Portable {keyword} - Travel Size",
            f"Luxury {keyword} Gift Edition",
        ]
        return [
            ProductData(
                platform="ebay",
                title=random.choice(mock_titles),
                price=round(random.uniform(9.99, 199.99), 2),
                currency="USD",
                sales_volume=random.randint(10, 5000),
                rating=round(random.uniform(3.0, 5.0), 1),
                review_count=random.randint(1, 500),
                image_url=f"https://picsum.photos/seed/{i}/400/400",
                product_url=f"https://ebay.com/itm/{i}",
                seller_name=f"seller_{random.randint(1000, 9999)}",
                crawled_at=datetime.now().isoformat(),
            )
            for i in range(min(max_items, 8))
        ]

    async def get_product_details(self, product_id: str) -> Optional[ProductData]:
        return None

    async def get_market_overview(self, category: str, **kwargs) -> MarketOverview:
        results = await self.search_products(category, max_items=30)
        prices = [p.price for p in results if p.price > 0]
        return MarketOverview(
            platform="ebay",
            category=category,
            total_products=len(results),
            price_min=min(prices) if prices else 0,
            price_max=max(prices) if prices else 0,
            price_avg=sum(prices)/len(prices) if prices else 0,
        )

    async def close(self):
        pass

    async def health_check(self) -> bool:
        return True
