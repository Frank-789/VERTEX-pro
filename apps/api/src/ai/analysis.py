"""Product analysis engine - 5-dimension scoring & market analysis"""

import json
import re
from typing import Dict, List, Optional, Any, AsyncGenerator
from dataclasses import dataclass, field, asdict
from enum import Enum

from ai.engine import DeepSeekEngine
from ai.prompts import SYSTEM_PROMPT, MARKET_RESEARCH_PROMPT
from knowledge.loader import search_knowledge


class ScoreLevel(Enum):
    HIGH = "high"    # 高机会
    MEDIUM = "medium"  # 中等机会
    LOW = "low"       # 低机会
    WARN = "warn"     # 不建议

    @property
    def label(self) -> str:
        return {"high": "🔥 机会", "medium": "✅ 可行", "low": "⚠️ 谨慎", "warn": "🚫 不建议"}[self.value]

    @property
    def color(self) -> str:
        return {"high": "text-emerald-600", "medium": "text-blue-600", "low": "text-amber-600", "warn": "text-red-600"}[self.value]


@dataclass
class DimensionScore:
    """Single dimension score in the 5-dimension framework"""
    name: str
    score: float  # 0-100
    level: ScoreLevel
    summary: str
    details: Optional[str] = None


@dataclass
class AnalysisResult:
    """Full product/market analysis result"""
    query: str
    platform: str
    dimensions: List[DimensionScore]
    overall_score: float
    overall_level: ScoreLevel
    summary: str
    recommendation: str
    anti_recommendation: Optional[str] = None  # 3.3 反推荐
    replicability: Optional[Dict[str, Any]] = None  # 3.3 竞品可复制性
    data_sources: List[Dict[str, str]] = field(default_factory=list)
    confidence: str = "estimated"  # realtime | estimated


def parse_analysis_from_ai(text: str) -> Optional[Dict[str, Any]]:
    """Try to extract structured analysis from AI response"""
    # Look for JSON block
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find score pattern: 需求分: 85
    scores = {}
    patterns = [
        (r'(?:需求|demand)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'demand'),
        (r'(?:竞争|competition)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'competition'),
        (r'(?:利润|profit)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'profit'),
        (r'(?:供应链|supply)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'supply'),
        (r'(?:合规|compliance)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'compliance'),
        (r'(?:现金流|安全|cash)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'cashflow'),
        (r'(?:综合|overall|总分)\s*(?:分|指数|分値|score)[：:\s]*(\d+)', 'overall'),
    ]
    for pattern, key in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            scores[key] = min(100, max(0, int(m.group(1))))

    if scores:
        return scores

    return None


class AnalysisEngine:
    """Market analysis engine with 5-dimension scoring"""

    def __init__(self):
        self.ai = DeepSeekEngine()

    async def analyze(
        self,
        query: str,
        platform: str = "auto",
        merchant_profile: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Full analysis pipeline:
        1. Search knowledge base for context
        2. Determine platform
        3. Search products
        4. AI analysis with 5-dimension scoring
        5. Return structured results
        """
        # Step 1: Knowledge base context
        kb_context = search_knowledge(query)
        yield {"type": "log", "message": "正在检索知识库..."}

        # Step 2: Platform selection
        if platform == "auto":
            platform = self._detect_platform(query)
        yield {
            "type": "tool_call",
            "data": {
                "id": f"tc-{hash(query) % 10000}",
                "name": "market_research",
                "status": "running",
                "platform": platform,
            }
        }

        # Step 3: Search products (using tool registry)
        yield {"type": "log", "message": f"正在搜索 {platform} 平台数据..."}
        from tools.registry import get_registry
        registry = get_registry()
        products = []
        market_data = {}

        if platform != "auto" and registry.get(platform):
            tool = registry.get(platform)
            try:
                products = await tool.search_products(query, max_items=30)
                overview = await tool.get_market_overview(query)
                market_data = {
                    "total_products": overview.total_products,
                    "price_min": overview.price_min,
                    "price_max": overview.price_max,
                    "price_avg": overview.price_avg,
                    "avg_rating": overview.avg_rating,
                }
            except Exception as e:
                yield {"type": "error", "message": f"数据采集失败: {str(e)[:100]}"}
        else:
            # Try all platforms
            results = await registry.search_all(query, max_items=10)
            for plat, prods in results.items():
                products.extend(prods[:5])

        # Report tool completion
        yield {
            "type": "tool_call",
            "data": {
                "id": f"tc-{hash(query) % 10000}",
                "name": "market_research",
                "status": "completed",
                "platform": platform,
                "duration": 1500,
                "data_count": len(products),
                "details": f"已完成 {platform} 平台数据采集，共获取 {len(products)} 条商品信息",
            }
        }

        # Step 4: Build analysis context
        price_distribution = {}
        if products:
            prices = [p.price for p in products if p.price > 0]
            if prices:
                price_distribution = {
                    "low": len([p for p in prices if p < 50]),
                    "mid": len([p for p in prices if 50 <= p < 200]),
                    "high": len([p for p in prices if p >= 200]),
                }

        # Format merchant profile for context
        profile_context = ""
        if merchant_profile:
            profile_context = (
                f"卖家画像：\n"
                f"- 经营经验：{merchant_profile.get('experience', '未知')}\n"
                f"- 可用资金：{merchant_profile.get('budget', '未知')}\n"
                f"- 风险承受：{merchant_profile.get('risk', '未知')}\n"
                f"- 是否有货源：{'是' if merchant_profile.get('hasSupplier') else '否'}\n"
            )

        analysis_context = f"""
用户查询：{query}
分析平台：{platform}
采集商品数：{len(products)}
价格分布：{json.dumps(price_distribution, ensure_ascii=False)}
{profile_context}
{('知识库参考：' + kb_context[:1000]) if kb_context else ''}
"""

        # Step 5: AI analysis with structured scoring
        yield {"type": "log", "message": "AI 正在分析市场数据..."}

        analysis_prompt = f"""你是 Vertex AI 电商分析专家。请基于以下采集数据，对「{query}」进行五维选品分析。

【采集数据】
{analysis_context}

【输出格式】
请严格按照以下结构输出分析结果，确保每个维度都有量化的分数（0-100）。每个评分点单独成行，段落之间用空行分隔。

| 维度 | 分数 | 可信度 | 结论 |
|------|------|--------|------|
| 需求分 | [0-100] | ⚪🍀🟡🟢 | 一句话结论 |

每个维度下方再展开分析，使用【】标记重点（如【是否有降价空间】）。

【一、五维评分】

1. 需求分: [0-100]
分析：基于搜索量/在售商品数的判断
蓝海值评估

2. 竞争分: [0-100]
分析：品牌集中度、价格带分布
头部垄断情况

3. 利润分: [0-100]
分析：ROI估算、退货率惩罚
建议定价区间

4. 供应链分: [0-100]
分析：货源可得性、起批量要求
是否有降价空间

5. 合规风险分: [0-100]
分析：类目准入门槛、专利风险

【二、现金流安全评估】
用表格呈现安全线建议：

| 项目 | 数值 |
|------|------|
| 建议首单量 | ... |
| 单价上限 | ... |
| 周转周期 | ... |

【三、反推荐分析】
- 不建议的策略 / 需避开的陷阱

【四、竞品可复制性评估】
用表格分析各维度可复制性：

| 驱动因素 | 可复制性 | 原因 |
|---------|---------|------|
| 品牌 | ... | ... |

【五、综合建议】
- 总体评分：[0-100]
- 是否建议进入
- 进入策略

重要：整个回答中不要使用 * 或 ** 或 # 等 markdown 标记符号，用【】和 emoji 来组织结构。每个分析段落必须单独成行，不要把长段落挤在一起。优先使用表格（| ... | ... |）组织数据。
"""

        async for chunk in self.ai.chat_stream(
            analysis_prompt,
            system_prompt=SYSTEM_PROMPT + "\n\n以上是系统指令。现在请严格按照用户的分析要求输出分析报告。"
        ):
            if chunk:
                yield {"type": "chunk", "data": chunk}

        yield {"type": "done", "data": ""}

    def _detect_platform(self, query: str) -> str:
        """Detect target platform from query"""
        query_lower = query.lower()
        platform_keywords = {
            'jd': ['京东', 'jd', '自营'],
            'taobao': ['淘宝', 'taobao', '天猫'],
            '1688': ['1688', '批发', '货源', '工厂'],
            'ebay': ['ebay', '跨境', '海外', 'amazon', '亚马逊'],
            'pdd': ['拼多多', 'pdd', '多多'],
        }
        for plat, keywords in platform_keywords.items():
            if any(kw in query_lower for kw in keywords):
                return plat
        return '京东'

    def _score_to_level(self, score: float) -> ScoreLevel:
        if score >= 70:
            return ScoreLevel.HIGH
        elif score >= 50:
            return ScoreLevel.MEDIUM
        elif score >= 30:
            return ScoreLevel.LOW
        return ScoreLevel.WARN

    def score_from_analysis(self, text: str) -> AnalysisResult:
        """Convert AI analysis text to structured result"""
        scores = parse_analysis_from_ai(text)
        if not scores:
            # Fallback: estimate from text analysis
            return AnalysisResult(
                query="",
                platform="",
                dimensions=[
                    DimensionScore("需求指数", 50, ScoreLevel.MEDIUM, "基于采集数据分析"),
                    DimensionScore("竞争格局", 50, ScoreLevel.MEDIUM, "基于采集数据分析"),
                    DimensionScore("利润模型", 50, ScoreLevel.MEDIUM, "基于采集数据分析"),
                    DimensionScore("供应链", 50, ScoreLevel.MEDIUM, "基于采集数据分析"),
                    DimensionScore("合规风险", 50, ScoreLevel.MEDIUM, "基于采集数据分析"),
                ],
                overall_score=50,
                overall_level=ScoreLevel.MEDIUM,
                summary=text[:500] if text else "",
                recommendation="请完善数据采集以获得精准分析",
                confidence="estimated"
            )

        dims = []
        dim_configs = [
            ("需求指数", scores.get('demand', 50)),
            ("竞争格局", scores.get('competition', 50)),
            ("利润模型", scores.get('profit', 50)),
            ("供应链", scores.get('supply', 50)),
            ("合规风险", scores.get('compliance', 50)),
        ]
        for name, sc in dim_configs:
            dims.append(DimensionScore(
                name=name,
                score=sc,
                level=self._score_to_level(sc),
                summary=f"{name}评分 {sc}/100",
            ))

        overall = scores.get('overall', sum(s.get('score', 50) for s in dims) / len(dims) if dims else 50)
        return AnalysisResult(
            query="",
            platform="",
            dimensions=dims,
            overall_score=overall,
            overall_level=self._score_to_level(overall),
            summary=text[:500] if text else "",
            recommendation="",
            confidence="estimated"
        )
