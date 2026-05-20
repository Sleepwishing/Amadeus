# backend/app/agent/llm_client.py
# 作用：封装与 LLM API 的通信逻辑
# 设计原则：把"怎么发 HTTP 请求"和"业务逻辑"分离
# 以后想换模型只需改这一个文件

import httpx                     # 异步 HTTP 客户端，比 requests 更适合 FastAPI 的 async
from app.config import get_settings  # 导入配置管理，读取 .env 里的 API 密钥

# 初始化时只读一次配置，避免每次请求都重新解析
_settings = get_settings()


async def chat(messages: list[dict]) -> str:
    """
    调用 LLM API 进行对话。

    参数:
        messages: 消息历史列表，格式如：
            [
                {"role": "system", "content": "你是Amadeus..."},
                {"role": "user", "content": "你好"}
            ]

    返回:
        LLM 的文字回复（字符串）
    """

    # 构造请求体，符合 OpenAI 兼容格式
    # 大多数中国接口（DeepSeek/Kimi/阿里/智谱）都遵循这个格式
    request_body = {
        "model": _settings.LLM_MODEL,       # 从 .env 读取的模型名，如 gpt-3.5-turbo
        "messages": messages,                # 消息列表
        "temperature": 0.7,                  # 温度：0=严谨，1=随机，0.7 是比较平衡的值
        "max_tokens": 2048,                  # 最多返回多少字，防止超长回复
    }

    # 请求头：携带 API Key 进行身份验证
    # Authorization: Bearer sk-xxxxxxxx 是行业标准格式
    headers = {
        "Authorization": f"Bearer {_settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    # 发送异步 POST 请求
    # httpx.AsyncClient() 是异步上下文管理器，with 语句确保连接自动关闭
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=f"{_settings.LLM_BASE_URL}/chat/completions",  # 完整接口地址
            headers=headers,
            json=request_body,                                    # httpx 会自动把 dict 转成 JSON
            timeout=60.0,                                         # 60秒超时，防止网络卡住
        )

    # 如果 HTTP 状态码不是 2xx，自动抛出异常（如 401 密钥错误、402 余额不足）
    print("[DEBUG] 请求体:", request_body)
    response.raise_for_status()

    # 解析 JSON 响应
    data = response.json()

    # OpenAI 格式：response.choices[0].message.content 即为回复文本
    # 如果结构不一致会抛 KeyError，以后可以加更友好的错误处理
    reply = data["choices"][0]["message"]["content"]

    return reply
