"""Data tools registry - manage all platform tools"""

from typing import Dict, Optional, List, Any
from .base import DataToolBase, ProductData, MarketOverview


class ToolRegistry:
    """Registry for all platform data tools"""

    def __init__(self):
        self._tools: Dict[str, DataToolBase] = {}

    def register(self, name: str, tool: DataToolBase):
        """Register a data tool"""
        self._tools[name] = tool

    def get(self, name: str) -> Optional[DataToolBase]:
        """Get a tool by name"""
        return self._tools.get(name)

    def list_tools(self) -> List[str]:
        """List all registered tools"""
        return list(self._tools.keys())

    async def search_all(
        self, keyword: str, max_items: int = 20
    ) -> Dict[str, List[ProductData]]:
        """Search across all platforms"""
        results = {}
        for name, tool in self._tools.items():
            try:
                products = await tool.search_products(keyword, max_items // max(len(self._tools), 1))
                if products:
                    results[name] = products
            except Exception as e:
                print(f"[{name}] 搜索失败: {e}")
        return results

    async def market_overview_all(
        self, category: str
    ) -> Dict[str, MarketOverview]:
        """Get market overview across all platforms"""
        results = {}
        for name, tool in self._tools.items():
            try:
                overview = await tool.get_market_overview(category)
                results[name] = overview
            except Exception as e:
                print(f"[{name}] 市场概览失败: {e}")
        return results

    async def close_all(self):
        """Close all tools"""
        for tool in self._tools.values():
            try:
                await tool.close()
            except Exception:
                pass


# Singleton registry
_registry: Optional[ToolRegistry] = None


def get_registry() -> ToolRegistry:
    """Get or create the global tool registry"""
    global _registry
    if _registry is None:
        _registry = ToolRegistry()

        # Register tools (lazy import to avoid heavy dependencies)
        try:
            from .jd import JDDataTool
            _registry.register("jd", JDDataTool())
            print("[Registry] JD tool registered")
        except Exception as e:
            print(f"[Registry] JD tool failed: {e}")

        try:
            from .taobao import TaobaoDataTool
            _registry.register("taobao", TaobaoDataTool())
            print("[Registry] Taobao tool registered")
        except Exception as e:
            print(f"[Registry] Taobao tool failed: {e}")

        try:
            from .alibaba import AlibabaDataTool
            _registry.register("1688", AlibabaDataTool())
            print("[Registry] 1688 tool registered")
        except Exception as e:
            print(f"[Registry] 1688 tool failed: {e}")

        try:
            from .ebay import EbayDataTool
            _registry.register("ebay", EbayDataTool())
            print("[Registry] eBay tool registered")
        except Exception as e:
            print(f"[Registry] eBay tool failed: {e}")

        # PDD temporarily disabled - will be added when implementation is ready
        # try:
        #     from .pdd import PDDDataTool
        #     _registry.register("pdd", PDDDataTool())
        # except Exception as e:
        #     print(f"[Registry] PDD tool failed: {e}")

    return _registry
