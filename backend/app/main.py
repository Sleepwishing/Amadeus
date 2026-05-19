from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn

from app.config import get_settings

settings = get_settings()

app = FastAPI(title="Amadeus AI Agent", version="0.1.0")

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


# TODO: P1 将添加 /chat 接口
# TODO: P3 将添加 /tts 接口
# TODO: P4 将添加记忆相关接口


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
