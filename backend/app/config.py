from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

class Settings(BaseSettings):
    # LLM API 配置 
    LLM_BASE_URL: str = str(os.environ.get("LLM_BASE_URL"))  # DeepSeek API 地址
    LLM_API_KEY: str = str(os.environ.get("LLM_API_KEY"))
    LLM_MODEL: str = str(os.environ.get("LLM_MODEL"))
    
    # TTS 配置
    TTS_VOICE: str = str(os.environ.get("TTS_VOICE"))  # Edge-TTS 中文女声
    TTS_RATE: str = str(os.environ.get("TTS_RATE"))
    TTS_VOLUME: str = str(os.environ.get("TTS_VOLUME"))
    
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
