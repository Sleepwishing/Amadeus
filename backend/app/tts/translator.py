# backend/app/tts/translator.py
# 中文 → 日文翻译，使用 DeepSeek API（片假名完美）

from app.agent.llm_client import chat


async def translate_to_japanese(text: str) -> str:
    """
    用 DeepSeek API 翻译中文→日文。
    英文专有名词自动转为片假名（El Psy Kongroo→エル・プサイ・コングルー）。
    """
    messages = [
        {
            "role": "system",
            "content": (
                "将用户输入翻译成自然流畅的日语口语。"
                "规则：1. 英文必须转为片假名 2. 只输出译文，不要解释。"
                "例：El Psy Kongroo→エル・プサイ・コングルー"
            ),
        },
        {"role": "user", "content": text},
    ]

    try:
        result = (await chat(messages)).strip()
        # 去掉逗号，防止 GPT-SoVITS 按逗号断句导致只合成前半段
        result = result.replace("、", "").replace("，", "").replace(",", "")
        return result
    except Exception:
        return text
