"""Abstract data tool interface for all platforms"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime


@dataclass
class ProductData:
    """Standardized product data across all platforms"""
    platform: str
    title: str
    price: float
    original_price: Optional[float] = None
    currency: str = "CNY"
    sales_volume: Optional[int] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    image_url: Optional[str] = None
    product_url: Optional[str] = None
    shop_name: Optional[str] = None
    seller_name: Optional[str] = None
    category: Optional[str] = None
    delivery_info: Optional[str] = None
    location: Optional[str] = None
    crawled_at: str = field(default_factory=lambda: datetime.now().isoformat())
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MarketOverview:
    """Market overview data"""
    platform: str
    category: str
    total_products: int
    price_min: float
    price_max: float
    price_avg: float
    avg_rating: Optional[float] = None
    top_brands: List[Dict[str, Any]] = field(default_factory=list)
    price_distribution: Dict[str, int] = field(default_factory=dict)
    crawled_at: str = field(default_factory=lambda: datetime.now().isoformat())


class DataToolBase(ABC):
    """Abstract base class for platform data tools"""

    @abstractmethod
    async def search_products(
        self, keyword: str, max_items: int = 50, **kwargs
    ) -> List[ProductData]:
        """Search products by keyword"""
        pass

    @abstractmethod
    async def get_product_details(self, product_id: str) -> Optional[ProductData]:
        """Get single product details"""
        pass

    @abstractmethod
    async def get_market_overview(
        self, category: str, **kwargs
    ) -> MarketOverview:
        """Get market overview for a category"""
        pass

    async def analyze_competitors(
        self, product_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Analyze competitor products (optional)"""
        return []

    async def health_check(self) -> bool:
        """Check if the tool is operational"""
        return True


def format_price(price_str: str) -> float:
    """Parse price string to float"""
    import re
    nums = re.findall(r'[\d.]+', str(price_str).replace(',', ''))
    return float(nums[0]) if nums else 0.0
