from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM API 配置 - 源宝可以在这里改成自己的 API
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_API_KEY: str = "sk-your-key-here"
    LLM_MODEL: str = "gpt-3.5-turbo"
    
    # TTS 配置
    TTS_VOICE: str = "zh-CN-XiaoxiaoNeural"  # Edge-TTS 中文女声
    TTS_RATE: str = "+0%"
    TTS_VOLUME: str = "+0%"
    
    # 记忆系统配置
    MEMORY_DB_PATH: str = "./data/memory.db"
    VECTOR_DB_PATH: str = "./data/chroma"
    MAX_CONTEXT_MSGS: int = 10  # 短期记忆保留消息数
    
    # 情感分析配置
    EMOTION_ENABLED: bool = True
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
