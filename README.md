# Vertex - AI电商经营智能体

面向中小电商卖家的AI全流程经营决策助手。多平台数据采集、五维选品分析、利润测算、主图生成。

## 产品模块

| 模块 | 功能 |
|------|------|
| **Vertex Chat** | 核心智能体对话，自然语言 → 自动采集数据 → 五维选品分析报告 |
| **Market Lab** | 数据分析工作台，查询历史、数据对比、图表、导出 |
| **Creative Studio** | 电商主图套件：白底/场景/卖点/对比/详情首屏 + Listing文案 |
| **Store Pilot** | 售中监控Demo：库存预警、差评提醒、清货建议看板 |
| **Data Crawler** | 数据采集工作台：多平台商品搜索、价格监控、评论抓取、货源扫描 |
| **Settings** | 商家画像：资金安全线计算、经营偏好配置 |

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Next.js 16, Tailwind CSS v4, Zustand, Lucide Icons |
| 后端 | FastAPI (Python), Uvicorn |
| AI | DeepSeek API (Streaming) |
| 采集 | Playwright (跨平台爬虫) |
| 知识库 | python-docx, RAG |
| 部署前端 | Vercel |
| 部署后端 | Render (Docker) |

## 快速开始

### 前置条件

- Node.js 18+
- Python 3.11+
- DeepSeek API Key

### 1. 启动后端

```bash
cd apps/api
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY

# 创建虚拟环境（首次）
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 安装 Playwright 浏览器（数据采集用）
playwright install chromium

# 启动 API 服务
uvicorn src.main:app --reload --port 8000
# API 文档: http://localhost:8000/docs
```

### 2. 启动前端

```bash
cd apps/web
npm install
npm run dev  # 访问 http://localhost:3000
```

### 3. 访问

打开 http://localhost:3000

## 环境变量

### 后端 (apps/api/.env)

```
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=8000
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000

# === Data Crawler ===
# Oxylabs API (1688, SHEIN 采集)
OXYLABS_USERNAME=
OXYLABS_PASSWORD=
OXYLABS_API_URL=https://realtime.oxylabs.io/v1/queries

# Apify Token (扩展平台采集)
APIFY_TOKEN=
APIFY_DEFAULT_ACTOR=

# eBay API (商品搜索)
EBAY_API_KEY=
```

### 前端 (apps/web/.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 部署

### 前端 → Vercel

详见 [Vercel 部署指南](./apps/web/vercel.json)

1. 在 [Vercel](https://vercel.com) 导入项目
2. 设置 Root Directory: `apps/web`
3. 配置环境变量 `NEXT_PUBLIC_API_URL`

### 后端 → Render

详见 [Render 配置](./render.yaml)

1. 在 [Render](https://render.com) 创建 Web Service
2. 选择 Docker 部署
3. 设置 Root Directory: `apps/api`
4. 配置环境变量 `DEEPSEEK_API_KEY`

> **注意**：为 Data Crawler 配置采集凭证后，才可以执行真实数据采集。未配置凭证的平台（缺少对应环境变量）会显示"需配置"状态，不会返回假数据冒充真实采集。

## 项目结构

```
vertex/
├── apps/
│   ├── web/              # Next.js 前端
│   │   ├── src/
│   │   │   ├── app/      # 页面
│   │   │   ├── components/  # 组件
│   │   │   └── lib/      # 工具、状态管理
│   │   └── vercel.json
│   └── api/              # FastAPI 后端
│       └── src/
│           ├── ai/       # DeepSeek + 分析引擎
│           ├── api/      # API 端点
│           ├── tools/    # 平台数据采集工具
│           ├── crawler/  # 数据采集工作台（平台注册 + 适配器）
│           ├── knowledge/ # 知识库 RAG
│           └── image/    # 图片生成
├── render.yaml           # Render 部署配置
└── package.json          # Monorepo 根
```
