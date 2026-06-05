"""Data tools API endpoints"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from tools.registry import get_registry

router = APIRouter()


class SearchRequest(BaseModel):
    keyword: str
    platform: Optional[str] = None  # None = all platforms
    max_items: int = 50


class MarketRequest(BaseModel):
    category: str
    platform: Optional[str] = None


@router.post("/search")
async def search_products(request: SearchRequest):
    """Search products across platforms"""
    registry = get_registry()
    print(f"[API] 搜索: {request.keyword} (platform={request.platform})")

    if request.platform:
        tool = registry.get(request.platform)
        if not tool:
            raise HTTPException(status_code=400, detail=f"不支持的平台: {request.platform}")
        results = await tool.search_products(request.keyword, request.max_items)
        return {
            "platform": request.platform,
            "keyword": request.keyword,
            "count": len(results),
            "results": [r.__dict__ for r in results],
        }
    else:
        results = await registry.search_all(request.keyword, request.max_items)
        total = sum(len(v) for v in results.values())
        return {
            "platform": "all",
            "keyword": request.keyword,
            "count": total,
            "results": {k: [r.__dict__ for r in v] for k, v in results.items()},
        }


@router.post("/market-overview")
async def market_overview(request: MarketRequest):
    """Get market overview for a category"""
    registry = get_registry()
    print(f"[API] 市场概览: {request.category} (platform={request.platform})")

    if request.platform:
        tool = registry.get(request.platform)
        if not tool:
            raise HTTPException(status_code=400, detail=f"不支持的平台: {request.platform}")
        overview = await tool.get_market_overview(request.category)
        return {"platform": request.platform, "overview": overview.__dict__}
    else:
        results = await registry.market_overview_all(request.category)
        return {
            "platform": "all",
            "results": {k: v.__dict__ for k, v in results.items()},
        }


@router.get("/platforms")
async def list_platforms():
    """List all available platforms"""
    registry = get_registry()
    return {"platforms": registry.list_tools()}


@router.get("/health")
async def tools_health():
    """Check all tool health"""
    registry = get_registry()
    results = {}
    for name in registry.list_tools():
        try:
            tool = registry.get(name)
            healthy = await tool.health_check()
            results[name] = "ok" if healthy else "unreachable"
        except Exception as e:
            results[name] = f"error: {str(e)[:50]}"
    return {"status": results}
