from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.agent.llm_client import chat_stream
import uvicorn

from app.config import get_settings

settings = get_settings()

app = FastAPI(title="Amadeus AI Agent", version="0.1.0")

class ChatRequest(BaseModel):
    message: str

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Amadeus is alive~", "version": "0.1.0"}


@app.get("/health")
async def health():
    """健康检查接口"""
    return {"status": "ok", "emotion_enabled": settings.EMOTION_ENABLED}


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    聊天接口，SSE 流式响应。

    不再返回 JSON，而是返回 text/event-stream。
    前端用 EventSource 或 fetch + ReadableStream 接收，实时看到打字效果。
    """

    # 1. 构造消息历史
    messages = [
        {"role": "system", "content": "你是Amadeus，一位聪明又有点傲娇的AI助手。"},
        {"role": "user", "content": request.message}
    ]

    # 2. 定义异步生成器
    # StreamingResponse 需要一个可迭代对象，每次 yield 一个 SSE 格式的数据块
    async def event_generator():
        """
        封装 chat_stream 的输出为 SSE 标准格式。

        SSE 格式要求：
            data: xxx\n\n
        \n\n 是分隔符，表示一个完整事件。
        前端收到这个格式后可以通过 event.data 读取 xxx。
        """
        # async for 遍历异步生成器，每次收到一小块文字
        async for chunk in chat_stream(messages):
            # 为了确保特殊字符不破坏 SSE 格式，先转为 JSON 字符串
            # 前端解码时再 json.loads 恢复原始文本
            import json
            payload = json.dumps({"chunk": chunk}, ensure_ascii=False)
            yield f"data: {payload}\n\n"

        # 流结束标志：发送一个空事件，或者前端检测连接关闭
        yield "data: [DONE]\n\n"

    # 3. 返回 StreamingResponse
    # media_type="text/event-stream" 是 SSE 的标准 MIME 类型
    # 这样浏览器才知道这是流式数据，会保持连接打开而不等待整体输出
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )

# TODO: P3 将添加 /tts 接口
# TODO: P4 将添加记忆相关接口


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
