# backend/app/tts/gpt_sovits.py
# 封装 GPT-SoVITS API 调用

import httpx

# GPT-SoVITS API 地址（默认本地 9880 端口）
SOVITS_API_URL = "http://localhost:9880"

# 请求超时（语音合成比较慢，给 60 秒）
TIMEOUT = 60.0


async def synthesize(text: str, text_language: str = "zh") -> bytes:
    """
    调用 GPT-SoVITS API 合成语音。

    参数：
        text:          要合成的文字（日文用日文原文，中文用中文）
        text_language: 语言代码，默认 "zh"（中文），可选 "ja"（日文）

    返回：
        音频文件的原始二进制数据（WAV 格式，48000Hz，16bit，单声道）
    """

    # 构造请求体
    # GPT-SoVITS 启动时已指定参考音频，这里只需传 text + language
    request_body = {
        "text": text,
        "text_language": text_language,
        "sample_steps": 4,    # V4 默认 8，降到 4 快 30-50%
    }

    # 发送异步 POST 请求
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=f"{SOVITS_API_URL}/",
            json=request_body,
            timeout=TIMEOUT,
        )

    # 检查 HTTP 状态
    response.raise_for_status()

    # 返回原始音频二进制（WAV 格式）
    return response.content
