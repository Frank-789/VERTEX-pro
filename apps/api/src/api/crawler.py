"""Data Crawler API endpoints"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from crawler.registry import get_registry
from crawler.models import (
    CrawlerTask, TaskStatus, ProductRecord,
    CrawlerPlatform, PlatformStatus,
)

router = APIRouter()


class CreateTaskRequest(BaseModel):
    platform: str
    keyword: str
    url: str = ""
    max_items: int = 20
    include_details: bool = False
    include_reviews: bool = False
    region: str = "CN"
    purpose: str = "选品分析"


class TaskResponse(BaseModel):
    id: str
    platform: str
    keyword: str
    url: str = ""
    max_items: int = 20
    include_details: bool = False
    include_reviews: bool = False
    region: str = "CN"
    purpose: str = ""
    status: TaskStatus
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    items_count: int = 0
    results: List[dict] = []
    error_message: Optional[str] = None
    next_action: Optional[str] = None


class PlatformResponse(BaseModel):
    id: str
    name: str
    status: PlatformStatus
    source_type: str
    capabilities: List[dict]
    required_env: List[str]
    limitations: List[str]
    recommended_for_production: bool
    risk_hints: List[str] = []
    data_sources: List[str] = []


def _task_to_response(task: CrawlerTask) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        platform=task.platform,
        keyword=task.keyword,
        url=task.url,
        max_items=task.max_items,
        include_details=task.include_details,
        include_reviews=task.include_reviews,
        region=task.region,
        purpose=task.purpose,
        status=task.status,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        items_count=task.items_count,
        results=[r.__dict__ for r in task.results],
        error_message=task.error_message,
        next_action=task.next_action,
    )


def _platform_to_response(p: CrawlerPlatform) -> PlatformResponse:
    return PlatformResponse(
        id=p.id,
        name=p.name,
        status=p.status,
        source_type=p.source_type.value,
        capabilities=[
            {"name": c.name, "available": c.available,
             "description": c.description, "requires_config": c.requires_config}
            for c in p.capabilities
        ],
        required_env=p.required_env,
        limitations=p.limitations,
        recommended_for_production=p.recommended_for_production,
        risk_hints=p.risk_hints,
        data_sources=p.data_sources,
    )


@router.get("/platforms")
async def list_platforms():
    """Return all platform capability states"""
    registry = get_registry()
    platforms = registry.get_platforms()
    return {
        "platforms": [_platform_to_response(p) for p in platforms],
        "total": len(platforms),
    }


@router.get("/platforms/{platform_id}")
async def get_platform(platform_id: str):
    """Return a single platform's capabilities"""
    registry = get_registry()
    platform = registry.get_platform(platform_id)
    if not platform:
        raise HTTPException(status_code=404, detail=f"未知平台: {platform_id}")
    return _platform_to_response(platform)


@router.post("/tasks", status_code=201)
async def create_task(request: CreateTaskRequest):
    """Create a new crawl task"""
    registry = get_registry()
    task = await registry.create_task(
        platform=request.platform,
        keyword=request.keyword,
        url=request.url,
        max_items=request.max_items,
        include_details=request.include_details,
        include_reviews=request.include_reviews,
        region=request.region,
        purpose=request.purpose,
    )
    return _task_to_response(task)


@router.get("/tasks")
async def list_tasks(limit: int = 20):
    """Return recent tasks"""
    registry = get_registry()
    tasks = registry.get_tasks(limit=limit)
    return {
        "tasks": [_task_to_response(t) for t in tasks],
        "total": len(tasks),
    }


@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Return task status and results"""
    registry = get_registry()
    task = registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"任务不存在: {task_id}")
    return _task_to_response(task)
