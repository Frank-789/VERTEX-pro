"""DeepSeek AI engine with streaming support"""

import os
import json
from typing import AsyncGenerator, Optional
import httpx
from ai.prompts import SYSTEM_PROMPT


class DeepSeekEngine:
    """DeepSeek API wrapper with streaming support"""

    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.client = httpx.AsyncClient(timeout=60.0)

    async def chat_stream(
        self,
        message: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion from DeepSeek"""
        if not self.api_key:
            yield "⚠️ DeepSeek API Key 未配置。请在环境变量中设置 DEEPSEEK_API_KEY。"
            return

        messages = [
            {"role": "system", "content": system_prompt or SYSTEM_PROMPT},
        ]

        if context:
            messages.append({"role": "system", "content": f"上下文信息：\n{context}"})

        messages.append({"role": "user", "content": message})

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": True,
                        "max_tokens": 4096,
                        "temperature": 0.7,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"⚠️ API 请求失败 ({response.status_code}): {error_text.decode()[:500]}"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:].strip()
                            if data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue

        except Exception as e:
            yield f"\n\n⚠️ 连接错误: {str(e)}"

    async def chat(
        self,
        message: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """Non-streaming chat completion"""
        result = []
        async for chunk in self.chat_stream(message, context, system_prompt):
            result.append(chunk)
        return "".join(result)

    async def close(self):
        await self.client.aclose()
