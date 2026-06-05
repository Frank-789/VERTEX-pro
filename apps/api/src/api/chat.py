"""Chat API endpoints with SSE streaming and real analysis engine"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from typing import Optional, List, Dict, Any
import json
import asyncio

from ai.engine import DeepSeekEngine
from ai.analysis import AnalysisEngine
from knowledge.loader import search_knowledge

router = APIRouter()
engine = DeepSeekEngine()
analyzer = AnalysisEngine()


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    platform: Optional[str] = "auto"
    merchant_profile: Optional[Dict[str, Any]] = None
    stream: bool = True


class ToolCallResult(BaseModel):
    id: str
    name: str
    status: str
    platform: Optional[str] = None
    duration: Optional[int] = None
    data_count: Optional[int] = None
    details: Optional[str] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat completion endpoint with real analysis engine"""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    async def event_generator():
        # If query looks like a product analysis request
        is_analysis_query = any(kw in request.message for kw in
            ['分析', '赚钱', '机会', '市场', '蓝海', '竞争', '对比', '推荐', '能不能做'])

        if is_analysis_query:
            # Run full analysis pipeline
            async for event in analyzer.analyze(
                query=request.message,
                platform=request.platform or "auto",
                merchant_profile=request.merchant_profile,
            ):
                if event["type"] == "tool_call":
                    yield {"event": "tool_call", "data": json.dumps(event["data"], ensure_ascii=False)}
                elif event["type"] == "chunk":
                    yield {"event": "chunk", "data": event["data"]}
                elif event["type"] == "log":
                    yield {"event": "log", "data": json.dumps({"message": event["message"]}, ensure_ascii=False)}
                elif event["type"] == "error":
                    yield {"event": "error", "data": json.dumps({"message": event["message"]}, ensure_ascii=False)}
                elif event["type"] == "done":
                    yield {"event": "done", "data": ""}
        else:
            # Normal chat - use DeepSeek directly with knowledge base context
            kb_context = search_knowledge(request.message)
            full_context = ""
            if kb_context:
                full_context += kb_context + "\n\n"

            # Add merchant profile context
            if request.merchant_profile:
                profile = request.merchant_profile
                full_context += (
                    f"[商家画像参考]\n"
                    f"经营经验：{profile.get('experience', '未知')}\n"
                    f"可用资金：{profile.get('budget', '未知')}\n"
                    f"风险类型：{profile.get('risk', '未知')}\n"
                    f"是否有一手货源：{'是' if profile.get('hasSupplier') else '否'}\n\n"
                )

            if request.context:
                full_context += request.context

            # Stream AI response
            yield {"event": "start", "data": ""}

            async for chunk in engine.chat_stream(request.message, full_context):
                if chunk:
                    yield {"event": "chunk", "data": chunk}

            yield {"event": "done", "data": ""}

    return EventSourceResponse(event_generator())


@router.post("/chat/simple")
async def chat_simple(request: ChatRequest):
    """Simple non-streaming chat for testing"""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    kb_context = search_knowledge(request.message)
    reply = await engine.chat(request.message, kb_context)
    return {
        "reply": reply,
        "data_sources": [
            {"label": "AI估算", "type": "estimated"}
        ]
    }
