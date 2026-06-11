"""Crawler data models - unified across all platforms"""
from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime


class TaskStatus(str, Enum):
    PENDING_CONFIG = "pending_config"   # 待配置凭证
    RUNNING = "running"                 # 运行中
    SUCCESS = "success"                 # 成功
    FAILED = "failed"                   # 失败
    NEEDS_VERIFICATION = "needs_verification"  # 需要人工验证


class PlatformStatus(str, Enum):
    SUPPORTED = "supported"            # 已支持
    NEEDS_CONFIG = "needs_config"      # 需配置
    EXPERIMENTAL = "experimental"      # 实验中
    NOT_RECOMMENDED = "not_recommended"  # 暂不建议生产


class SourceType(str, Enum):
    OXYLABS = "oxylabs"                # Oxylabs 商业 API
    APIFY = "apify"                    # Apify Actor
    BROWSER = "browser"                # 本地浏览器
    OFFICIAL_API = "official_api"      # 官方 API
    PENDING = "pending"                # 待接入
    MANUAL = "manual"                  # 需要手动授权


@dataclass
class CrawlerCapability:
    """Single capability descriptor"""
    name: str                          # e.g. "商品搜索"
    available: bool                    # 当前是否可用
    description: str                   # 说明
    requires_config: bool = False


@dataclass
class CrawlerPlatform:
    """Platform metadata - drives frontend UI cards"""
    id: str
    name: str                          # Display name
    status: PlatformStatus
    source_type: SourceType
    capabilities: List[CrawlerCapability]
    required_env: List[str]            # Env vars needed
    limitations: List[str]             # Known limitations
    recommended_for_production: bool
    risk_hints: List[str] = field(default_factory=list)  # 风险提示
    data_sources: List[str] = field(default_factory=list)  # 数据来源描述


@dataclass
class ProductRecord:
    """Unified product record from any platform"""
    platform: str
    title: str
    price: float = 0.0
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
    location: Optional[str] = None
    source: str = "unknown"
    crawled_at: str = field(default_factory=lambda: datetime.now().isoformat())
    raw_data: Dict[str, Any] = field(default_factory=dict)
    parse_warning: Optional[str] = None  # 结构化解析警告


@dataclass
class CrawlerTask:
    """A crawl task with full lifecycle"""
    id: str
    platform: str
    keyword: str
    url: str = ""
    max_items: int = 20
    include_details: bool = False
    include_reviews: bool = False
    region: str = "CN"
    purpose: str = ""
    status: TaskStatus = TaskStatus.PENDING_CONFIG
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None
    items_count: int = 0
    results: List[ProductRecord] = field(default_factory=list)
    error_message: Optional[str] = None
    next_action: Optional[str] = None


# In-memory task storage (to be replaced with DB later)
TASK_STORE: Dict[str, CrawlerTask] = {}
