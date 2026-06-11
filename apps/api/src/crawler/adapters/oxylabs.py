"""Oxylabs API adapters - for 1688, SHEIN and other Oxylabs-supported platforms"""
from .base import BaseOxylabsAdapter


class Oxylabs1688Adapter(BaseOxylabsAdapter):
    """1688 crawler via Oxylabs API"""

    def __init__(self):
        super().__init__(source="universal")

    def _build_search_url(self, keyword: str) -> str:
        import urllib.parse
        encoded = urllib.parse.quote(keyword)
        return f"https://p4psearch.1688.com/hammer.html?keywords={encoded}&tab=product"

    def _platform_name(self) -> str:
        return "1688"


class OxylabsSheinAdapter(BaseOxylabsAdapter):
    """SHEIN crawler via Oxylabs API"""

    def __init__(self):
        super().__init__(source="universal")

    def _build_search_url(self, keyword: str) -> str:
        import urllib.parse
        encoded = urllib.parse.quote(keyword)
        return f"https://www.shein.com/pdsearch/{encoded}/"

    def _platform_name(self) -> str:
        return "shein"
