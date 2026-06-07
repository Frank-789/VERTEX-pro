"""Vertex Creative Studio API - Image Plan Generation"""
import json
import os
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()

# AI configuration — DeepSeek preferred, Kimi fallback
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn")


class ProductInfo(BaseModel):
    productName: str
    category: str
    targetPlatform: str
    sellingPoints: str
    targetAudience: str
    usageScenario: str
    stylePreference: str
    customStyle: str
    forbiddenElements: str


class PlanRequest(BaseModel):
    productInfo: ProductInfo


class ImagePlan(BaseModel):
    slot: str
    purpose: str
    visualDescription: str
    compositionAdvice: str
    backgroundAdvice: str
    highlightSellingPoints: list[str]
    forbiddenElements: list[str]
    englishPrompt: str
    chineseExplanation: str


class PlanResponse(BaseModel):
    plans: list[ImagePlan]
    model: str = "deepseek-chat"


async def _call_llm(*, base_url: str, api_key: str, model: str, system_prompt: str, user_prompt: str) -> str:
    """Call an OpenAI-compatible LLM API and return the response text."""
    url = base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{url}/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 8192,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


@router.post("/creative-studio/generate-plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    """Generate an image plan using DeepSeek (preferred) → Kimi (fallback)."""
    if not DEEPSEEK_API_KEY and not KIMI_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="未配置 AI API Key。请在环境变量中设置 DEEPSEEK_API_KEY 或 KIMI_API_KEY。"
        )

    info = request.productInfo

    system_prompt = """你是一个专业的电商图片策划助手。严格按照用户要求输出结构化 JSON 数据，
不要包含任何额外的解释文字或 markdown 代码块标记。
只返回纯 JSON 数组。"""

    user_prompt = f"""你是一位专业的电商视觉策划师。请根据以下商品信息，生成一套完整的电商图片策划方案。

## 商品信息
- 商品名称：{info.productName or '（未填写）'}
- 商品类目：{info.category or '（未填写）'}
- 目标平台：{info.targetPlatform or '（未指定）'}
- 核心卖点：{info.sellingPoints or '（未填写）'}
- 目标人群：{info.targetAudience or '（未指定）'}
- 使用场景：{info.usageScenario or '（未指定）'}
- 风格偏好：{info.stylePreference or '（未指定）'}
{' - 禁止元素：' + info.forbiddenElements if info.forbiddenElements else ''}

## 策划要求

请为以下每个图片位生成策划方案，返回 JSON 数组：

图片位列表：主图、场景图1、场景图2、卖点图、细节图、尺寸/结构图、对比图、详情页首图、详情页模块图

每个图片位需要包含：
1. slot: 图片位名称
2. purpose: 该图片的用途说明（中文）
3. visualDescription: 画面描述（中文，详细描述画面构图、产品摆放、场景元素等）
4. compositionAdvice: 构图建议（中文）
5. backgroundAdvice: 背景建议（中文）
6. highlightSellingPoints: 应突出的卖点列表（字符串数组，不要有空字符串）
7. forbiddenElements: 禁止出现的元素列表（字符串数组，不要有空字符串）
8. englishPrompt: 英文生图 prompt（专业、完整，可直接用于 AI 生图模型）
   - 包含商品描述、场景、构图、光线、风格
   - 如果指定了风格偏好，要在 prompt 中体现
   - 不包含中文字符
9. chineseExplanation: 中文解释（面向用户的中文说明）

## 通用合规规则
- 商品主体清晰
- 不出现未授权品牌 Logo
- 不出现虚假认证
- 不出现平台 Logo
- 不出现夸大功效表述
- 不出现诱导性价格、销量、评价
- 白底主图要干净，商品占比合理

## 输出格式
直接返回 JSON 数组，不要包含 markdown 代码块标记和额外说明：
[{{ "slot": "...", "purpose": "...", ... }}]"""

    # Try DeepSeek first, Kimi as fallback
    content = None
    used_model = ""

    if DEEPSEEK_API_KEY:
        try:
            content = await _call_llm(
                base_url=DEEPSEEK_BASE_URL,
                api_key=DEEPSEEK_API_KEY,
                model="deepseek-chat",
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            used_model = "deepseek-chat"
        except Exception as e:
            if not KIMI_API_KEY:
                raise HTTPException(status_code=502, detail=f"DeepSeek API 调用失败: {str(e)[:200]}")

    if content is None and KIMI_API_KEY:
        try:
            content = await _call_llm(
                base_url=KIMI_BASE_URL,
                api_key=KIMI_API_KEY,
                model="moonshot-v1-8k",
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            used_model = "moonshot-v1-8k (Kimi fallback)"
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Kimi API 调用失败: {str(e)[:200]}")

    if content is None:
        raise HTTPException(status_code=500, detail="所有 AI API 均无法生成策划方案")

    # Parse JSON from response
    try:
        plans = json.loads(content)
    except json.JSONDecodeError:
        # Try extracting from markdown code block
        import re
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
        if json_match:
            try:
                plans = json.loads(json_match.group(1))
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="无法解析 AI 返回的策划方案 JSON")
        else:
            # Try finding JSON array directly
            arr_start = content.find('[{')
            arr_end = content.rfind('}]')
            if arr_start != -1 and arr_end != -1:
                try:
                    plans = json.loads(content[arr_start:arr_end + 2])
                except json.JSONDecodeError:
                    raise HTTPException(status_code=500, detail="无法解析 AI 返回的策划方案 JSON")
            else:
                raise HTTPException(status_code=500, detail="AI 返回内容不包含有效的 JSON 数组")

    if not isinstance(plans, list) or len(plans) == 0:
        raise HTTPException(status_code=500, detail="AI 返回的策划方案为空")

    # Validate and sanitize
    validated_plans = []
    for p in plans:
        validated_plans.append(ImagePlan(
            slot=p.get("slot", ""),
            purpose=p.get("purpose", ""),
            visualDescription=p.get("visualDescription", ""),
            compositionAdvice=p.get("compositionAdvice", ""),
            backgroundAdvice=p.get("backgroundAdvice", ""),
            highlightSellingPoints=[s for s in p.get("highlightSellingPoints", []) if s],
            forbiddenElements=[s for s in p.get("forbiddenElements", []) if s],
            englishPrompt=p.get("englishPrompt", ""),
            chineseExplanation=p.get("chineseExplanation", ""),
        ))

    return PlanResponse(plans=validated_plans, model=used_model or "unknown")


@router.get("/creative-studio/health")
async def creative_health():
    """Check if Creative Studio backend is properly configured."""
    providers = []
    if DEEPSEEK_API_KEY:
        providers.append("deepseek")
    if KIMI_API_KEY:
        providers.append("kimi")
    return {
        "configured": bool(providers),
        "providers": providers or ["none"],
        "message": "Creative Studio API is running"
        if providers
        else "未配置 AI API Key，请在环境变量中设置 DEEPSEEK_API_KEY 或 KIMI_API_KEY",
    }
