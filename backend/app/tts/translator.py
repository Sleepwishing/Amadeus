# backend/app/tts/translator.py
# 中文 → 日文翻译，用于 TTS 前转换
# v2: 从 DeepSeek API 改为本地 Ollama qwen2.5:0.5b（延迟 5.5s → ~1s）

import httpx

# Ollama 本地服务地址（Windows 端 Ollama，WSL 可以 localhost 访问）
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:0.5b"
TIMEOUT = 30.0


async def translate_to_japanese(text: str) -> str:
    """
    调用本地 Ollama 轻量模型，将中文翻译成日语。

    为什么用本地模型？
        DeepSeek API 翻译 100 字需要 5 秒（网络 + 排队），
        本地 qwen2.5:0.5b 在 GPU 上只需 1 秒，显存只占 0.5GB。

    为什么 qwen2.5:0.5b 够用？
        翻译是确定性任务，不需要推理、不需要创造力。
        0.5B 参数的小模型，专门做翻译，质量足够，速度最快。
    """

    # 明确的翻译指令
    prompt = (
        f"将以下中文翻译成自然流畅的日语口语。只输出日语译文，不要任何解释或注音。\n\n"
        f"中文：{text}\n"
        f"日语："
    )

    request_body = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,          # 翻译不需要流式，等整段结果
        "temperature": 0.1,       # 翻译要稳定，不要随机变化
        "num_predict": 512,       # 最多返回 512 字符，防止模型跑偏
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=OLLAMA_URL,
                json=request_body,
                timeout=TIMEOUT,
            )
        response.raise_for_status()
        data = response.json()

        # Ollama 返回格式: {"response": "翻译结果"}
        ja_text = data.get("response", "").strip()

        if not ja_text:
            # 翻译失败时 fallback：返回原文（用中文合成，总比没声音好）
            return text

        return ja_text

    except Exception as e:
        print(f"[Translator] Ollama 翻译失败: {e}, 降级使用原文")
        return text
