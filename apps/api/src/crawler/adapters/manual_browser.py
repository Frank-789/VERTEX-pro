"""Manual browser adapter - for platforms that require local browser + manual login

Used for Shopee, Pinduoduo, and other platforms that need:
- Manual login and cookie extraction
- undetected-chromedriver or similar
- CAPTCHA handling
- Local browser session

These platforms are NOT suitable for server-side automated crawling.
"""
from typing import List
from .base import BaseCrawlerAdapter
from ..models import ProductRecord


class ManualBrowserAdapter(BaseCrawlerAdapter):
    """Placeholder adapter for browser-dependent platforms

    Always returns empty results with clear instructions that
    manual login and local browser are required.
    """

    def __init__(self, platform_id: str):
        self.platform_id = platform_id

    def is_configured(self) -> bool:
        # These platforms always need manual browser - never "configured" via env
        return False

    def get_required_env(self) -> List[str]:
        return ["需要本地浏览器 + 手动登录"]

    async def crawl(self, keyword: str, max_items: int = 20, **kwargs) -> List[ProductRecord]:
        # Always return empty - never fake results
        return [ProductRecord(
            platform=self.platform_id,
            title=keyword,
            price=0.0,
            source="manual_browser",
            parse_warning=(
                f"{self.platform_id} 需要本地浏览器 + 手动登录授权，"
                f"无法在服务端自动采集。\n"
                f"请参考对应平台的爬虫脚本，在本地环境中手动运行。"
            ),
        )]
