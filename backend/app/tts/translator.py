# backend/app/tts/translator.py
# 中文 → 日文翻译，用于 TTS 前转换

from app.agent.llm_client import chat  # 用非流式版本，只等一句翻译就够了


async def translate_to_japanese(text: str) -> str:
    """
    将文本翻译成日语。

    为什么需要这一步？
        GPT-SoVITS 是用红莉栖日文音频训练的，日语合成效果最好。

    为什么用 chat 而不是 chat_stream？
        翻译只需要结果，不需要逐字流式显示，等整句翻完再合成更合理。
    """

    messages = [
        {
            "role": "system",
            "content": (
                "你是专业中日翻译。把用户输入翻译成自然流畅的日语口语。\n"
                "规则：\n"
                "1. 只输出日语译文，不要任何解释、括号、注音\n"
                "2. 保持原文的语气和情感（傲娇、温柔、惊讶等）\n"
                "3. 用敬体（です/ます）或口语体视语境而定\n"
                "4. 翻译后不要加句号之外的标点"
            ),
        },
        {"role": "user", "content": text},
    ]


    try:
        ja_text = await chat(messages)
        return ja_text.strip()
    except Exception:
        # 翻译失败时直接返回原文（用中文合成，总比没声音好）
        return text
