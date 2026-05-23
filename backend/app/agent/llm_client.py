# backend/app/agent/llm_client.py
# 作用：封装与 LLM API 的通信逻辑
# 设计原则：把"怎么发 HTTP 请求"和"业务逻辑"分离
# 以后想换模型只需改这一个文件

import httpx                     # 异步 HTTP 客户端，比 requests 更适合 FastAPI 的 async
import json                     # 流式解析需要手动 json.loads
from app.config import get_settings  # 导入配置管理，读取 .env 里的 API 密钥

# 初始化时只读一次配置，避免每次请求都重新解析
_settings = get_settings()


async def chat(messages: list[dict]) -> str:
    """
    调用 LLM API 进行对话。（非流式版本，保留作为 fallback）

    参数:
        messages: 消息历史列表，格式如：
            [
                {"role": "system", "content": "你是Amadeus..."},
                {"role": "user", "content": "你好"}
            ]

    返回:
        LLM 的文字回复（字符串）
    """

    request_body = {
        "model": _settings.LLM_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
    }

    headers = {
        "Authorization": f"Bearer {_settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=f"{_settings.LLM_BASE_URL}/chat/completions",
            headers=headers,
            json=request_body,
            timeout=60.0,
        )

    response.raise_for_status()
    data = response.json()
    reply = data["choices"][0]["message"]["content"]

    return reply


async def chat_stream(messages: list[dict]):
    """
    流式调用 LLM API，逐字返回回复。

    这是一个异步生成器（async generator），用 yield 代替 return。
    每产生一个字符或一小段文本，调用者可以实时处理，不用等 LLM 说完整句话。

    使用方式：
        async for chunk in chat_stream(messages):
            print(chunk)   # 每收到一小块就打印

    技术原理：
        LLM 服务器通过 SSE（Server-Sent Events）一边生成一边发送。
        每条消息格式为：data: {"choices":[{"delta":{"content":"你"}}]}\n\n
        最后一条是：data: [DONE]\n\n
    """

    # 1. 构造请求体，关键差异是 "stream": true
    request_body = {
        "model": _settings.LLM_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
        "stream": True,          # 【关键】启动流式输出模式
    }

    headers = {
        "Authorization": f"Bearer {_settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    # 2. 使用 httpx 的 stream 模式
    # client.stream() 不会一次性读取响应体，而是逐行读取
    async with httpx.AsyncClient() as client:
        async with client.stream(
            method="POST",
            url=f"{_settings.LLM_BASE_URL}/chat/completions",
            headers=headers,
            json=request_body,
            timeout=60.0,
        ) as response:

            # 68f6查 HTTP 状态（这时还没开始读流，先检查是否 401/403/429 等）
            response.raise_for_status()

            # 3. 逐行读取流式响应
            # aiter_lines() 自动按 \n 分割，返回每一行文本
            async for line in response.aiter_lines():
                # 过滤空行和非数据行
                if not line or not line.startswith("data: "):
                    continue

                # 去掉前缀 "data: "，取出 JSON 本体
                data_str = line[len("data: "):]

                # 结束标志：服务端发完所有内容后会发这个
                if data_str == "[DONE]":
                    break

                # 4. 解析 JSON，提取 delta.content
                try:
                    obj = json.loads(data_str)
                    # 示例结构：{"choices": [{"delta": {"content": "你"}}]}
                    delta = obj["choices"][0]["delta"]
                    content = delta.get("content")   # .get() 避免 key 不存在时抛异常

                    # 只有实际文字内容才产生（有时候 delta 可能只有 role 没有 content）
                    if content:
                        yield content

                except (json.JSONDecodeError, KeyError, IndexError):
                    # 解析失败忽略，不影响整体流
                    continue
