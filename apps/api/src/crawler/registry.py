"""Crawler platform registry - manages adapters and platform metadata"""
import os
from typing import Dict, List, Optional
from datetime import datetime

from .models import (
    CrawlerPlatform, CrawlerCapability, CrawlerTask,
    TaskStatus, PlatformStatus, SourceType, ProductRecord,
    TASK_STORE,
)
from .adapters.base import BaseCrawlerAdapter


class CrawlerRegistry:
    """Registry for all crawler platform adapters"""

    def __init__(self):
        self._platforms: Dict[str, CrawlerPlatform] = {}
        self._adapters: Dict[str, BaseCrawlerAdapter] = {}
        self._task_counter = 0

    def register(self, platform_id: str, platform: CrawlerPlatform, adapter: BaseCrawlerAdapter):
        """Register a platform and its adapter"""
        self._platforms[platform_id] = platform
        self._adapters[platform_id] = adapter

    def get_platforms(self) -> List[CrawlerPlatform]:
        """Return all registered platform metadata"""
        return list(self._platforms.values())

    def get_platform(self, platform_id: str) -> Optional[CrawlerPlatform]:
        return self._platforms.get(platform_id)

    def get_adapter(self, platform_id: str) -> Optional[BaseCrawlerAdapter]:
        return self._adapters.get(platform_id)

    async def create_task(self, platform: str, keyword: str, **kwargs) -> CrawlerTask:
        """Create a new crawl task"""
        adapter = self.get_adapter(platform)
        platform_info = self.get_platform(platform)

        if not adapter or not platform_info:
            task = CrawlerTask(
                id=self._next_task_id(),
                platform=platform,
                keyword=keyword,
                status=TaskStatus.PENDING_CONFIG,
                error_message=f"不支持的平台: {platform}",
                next_action="请选择支持的平台",
                **kwargs,
            )
            TASK_STORE[task.id] = task
            return task

        # Check if platform is configured
        if not adapter.is_configured():
            missing = [v for v in platform_info.required_env if not os.getenv(v)]
            task = CrawlerTask(
                id=self._next_task_id(),
                platform=platform,
                keyword=keyword,
                status=TaskStatus.PENDING_CONFIG,
                error_message=f"平台 {platform_info.name} 未配置凭证",
                next_action=f"请在环境变量中配置: {', '.join(missing)}" if missing else "请配置平台凭证后重试",
                **kwargs,
            )
            TASK_STORE[task.id] = task
            return task

        # Create and run the task
        task = CrawlerTask(
            id=self._next_task_id(),
            platform=platform,
            keyword=keyword,
            status=TaskStatus.RUNNING,
            **kwargs,
        )
        TASK_STORE[task.id] = task

        try:
            # Filter out already-explicitly-passed params from kwargs
            crawl_kwargs = {k: v for k, v in kwargs.items() if k not in ("keyword", "max_items")}
            results = await adapter.crawl(keyword=keyword, max_items=kwargs.get("max_items", 20), **crawl_kwargs)
            task.results = results
            task.items_count = len(results)
            task.status = TaskStatus.SUCCESS
            task.updated_at = datetime.now().isoformat()
            task.completed_at = datetime.now().isoformat()

            # Check if any result has parse warnings
            if any(r.parse_warning for r in results):
                task.status = TaskStatus.NEEDS_VERIFICATION
                task.next_action = "已获取页面内容，但部分结构化解析待完善"
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error_message = str(e)[:500]
            task.next_action = "请检查凭证是否正确或重试"
            task.updated_at = datetime.now().isoformat()

        return task

    def get_task(self, task_id: str) -> Optional[CrawlerTask]:
        return TASK_STORE.get(task_id)

    def get_tasks(self, limit: int = 20) -> List[CrawlerTask]:
        """Return recent tasks"""
        tasks = sorted(TASK_STORE.values(), key=lambda t: t.created_at, reverse=True)
        return tasks[:limit]

    def _next_task_id(self) -> str:
        self._task_counter += 1
        ts = datetime.now().strftime("%y%m%d%H%M%S")
        return f"CT{ts}-{self._task_counter:04d}"


# Singleton
_registry: Optional[CrawlerRegistry] = None


def get_registry() -> CrawlerRegistry:
    global _registry
    if _registry is None:
        _registry = CrawlerRegistry()
        _register_default_platforms(_registry)
    return _registry


def _register_default_platforms(registry: CrawlerRegistry):
    """Register all built-in platforms"""
    from .adapters.oxylabs import Oxylabs1688Adapter, OxylabsSheinAdapter
    from .adapters.oxylabs_amazon import OxylabsAmazonAdapter
    from .adapters.apify import ApifyAdapter
    from .adapters.ebay_existing import EbayCrawlerAdapter
    from .adapters.manual_browser import ManualBrowserAdapter

    # 1688 via Oxylabs
    registry.register("1688", CrawlerPlatform(
        id="1688",
        name="1688",
        status=PlatformStatus.NEEDS_CONFIG,
        source_type=SourceType.OXYLABS,
        capabilities=[
            CrawlerCapability("商品搜索", True, "通过关键词搜索商品"),
            CrawlerCapability("商品详情", True, "抓取商品详情页"),
            CrawlerCapability("价格", True, "采集价格信息"),
            CrawlerCapability("销量", False, "销量数据需要额外解析"),
            CrawlerCapability("评论", False, "评论采集待完善"),
            CrawlerCapability("店铺信息", True, "店铺基本信息"),
        ],
        required_env=["OXYLABS_USERNAME", "OXYLABS_PASSWORD"],
        limitations=["需要商业 Oxylabs API 凭证", "HTML 解析可能不完整"],
        recommended_for_production=False,
        risk_hints=["依赖第三方商业 API"],
        data_sources=["Oxylabs 商业爬虫 API"],
    ), Oxylabs1688Adapter())

    # Amazon via Oxylabs
    registry.register("amazon", CrawlerPlatform(
        id="amazon",
        name="Amazon",
        status=PlatformStatus.NEEDS_CONFIG,
        source_type=SourceType.OXYLABS,
        capabilities=[
            CrawlerCapability("商品搜索", True, "通过关键词搜索 Amazon 商品"),
            CrawlerCapability("商品详情", True, "抓取商品详情页"),
            CrawlerCapability("价格", True, "采集价格信息"),
            CrawlerCapability("销量", True, "销量排行数据"),
            CrawlerCapability("评论", True, "评论数和评分"),
            CrawlerCapability("店铺信息", True, "卖家信息"),
        ],
        required_env=["OXYLABS_USERNAME", "OXYLABS_PASSWORD"],
        limitations=["需要商业 Oxylabs API 凭证", "免费账号可能不返回抓取内容"],
        recommended_for_production=False,
        risk_hints=["依赖第三方商业 API"],
        data_sources=["Oxylabs 商业爬虫 API"],
    ), OxylabsAmazonAdapter())

    # SHEIN via Oxylabs
    registry.register("shein", CrawlerPlatform(
        id="shein",
        name="SHEIN",
        status=PlatformStatus.EXPERIMENTAL,
        source_type=SourceType.OXYLABS,
        capabilities=[
            CrawlerCapability("商品搜索", True, "通过关键词搜索商品"),
            CrawlerCapability("商品详情", True, "抓取商品详情页"),
            CrawlerCapability("价格", True, "采集价格信息"),
            CrawlerCapability("销量", False, "销量数据待验证"),
            CrawlerCapability("评论", False, "评论采集待完善"),
        ],
        required_env=["OXYLABS_USERNAME", "OXYLABS_PASSWORD"],
        limitations=["需要商业 Oxylabs API 凭证", "HTML 解析不完整", "SHEIN 反爬严格"],
        recommended_for_production=False,
        risk_hints=["依赖第三方商业 API", "SHEIN 可能限制访问频率"],
        data_sources=["Oxylabs 商业爬虫 API"],
    ), OxylabsSheinAdapter())

    # eBay via existing tool
    registry.register("ebay", CrawlerPlatform(
        id="ebay",
        name="eBay",
        status=PlatformStatus.NEEDS_CONFIG,
        source_type=SourceType.OFFICIAL_API,
        capabilities=[
            CrawlerCapability("商品搜索", True, "通过 eBay Browse API 搜索"),
            CrawlerCapability("商品详情", True, "获取商品详细信息"),
            CrawlerCapability("价格", True, "实时价格"),
            CrawlerCapability("销量", True, "历史销量数据"),
            CrawlerCapability("评论", True, "评论和评分"),
            CrawlerCapability("店铺信息", True, "卖家信息"),
        ],
        required_env=["EBAY_API_KEY"],
        limitations=["需要 eBay API Key", "免费配额有限"],
        recommended_for_production=True,
        risk_hints=["API 调用有频率限制"],
        data_sources=["eBay Browse API"],
    ), EbayCrawlerAdapter())

    # Shopee (manual browser - experimental)
    registry.register("shopee", CrawlerPlatform(
        id="shopee",
        name="Shopee",
        status=PlatformStatus.EXPERIMENTAL,
        source_type=SourceType.BROWSER,
        capabilities=[
            CrawlerCapability("商品搜索", False, "需要本地浏览器 + 登录"),
            CrawlerCapability("商品详情", False, "需要本地浏览器 + 登录"),
            CrawlerCapability("价格", False, "需要本地浏览器 + 登录"),
            CrawlerCapability("评论", False, "需要本地浏览器 + 登录"),
        ],
        required_env=["SHOPEE_COOKIE"],
        limitations=["需要手动登录获取 Cookie", "需要 undetected-chromedriver", "验证码处理"],
        recommended_for_production=False,
        risk_hints=["需要登录", "验证码限制", "不能在生产环境自动运行"],
        data_sources=["本地浏览器"],
    ), ManualBrowserAdapter("shopee"))

    # 拼多多 (manual)
    registry.register("pinduoduo", CrawlerPlatform(
        id="pinduoduo",
        name="拼多多",
        status=PlatformStatus.NOT_RECOMMENDED,
        source_type=SourceType.MANUAL,
        capabilities=[
            CrawlerCapability("商品搜索", False, "强制登录，暂不支持自动采集"),
            CrawlerCapability("商品详情", False, "强制登录，暂不支持自动采集"),
            CrawlerCapability("价格", False, "需要登录后 Cookie"),
        ],
        required_env=["PDD_COOKIE"],
        limitations=["强制短信登录", "严格反爬", "合规风险"],
        recommended_for_production=False,
        risk_hints=["强制登录", "验证码", "账号可能被限制", "合规风险"],
        data_sources=["待接入"],
    ), ManualBrowserAdapter("pinduoduo"))

    # Apify extension platform
    registry.register("apify", CrawlerPlatform(
        id="apify",
        name="Apify 扩展平台",
        status=PlatformStatus.NEEDS_CONFIG,
        source_type=SourceType.APIFY,
        capabilities=[
            CrawlerCapability("商品搜索", False, "需要配置 Apify Token 和 Actor"),
            CrawlerCapability("商品详情", False, "取决于所选 Actor"),
            CrawlerCapability("价格", False, "取决于所选 Actor"),
            CrawlerCapability("评论", False, "取决于所选 Actor"),
        ],
        required_env=["APIFY_TOKEN", "APIFY_DEFAULT_ACTOR"],
        limitations=["需要 Apify Token", "需要选择合适的 Actor", "各 Actor 能力不同"],
        recommended_for_production=False,
        risk_hints=["需要商业 Apify 账号"],
        data_sources=["Apify Marketplace Actor"],
    ), ApifyAdapter())
