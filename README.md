# Amadeus - AI Agent System

搭载 Live2D 红莉栖、GPT-SoVITS 语音合成、长期记忆、情感分析的 AI Agent。

> 边做边学，每个阶段都可运行、可验证。

---

## 当前进度

```
P0 骨架搭建        ✅ Live2D + 聊天界面
P1 基础聊天        ✅ LLM API 接入
P2 流式响应        ✅ SSE 打字机效果
P3 TTS 语音        ✅ GPT-SoVITS 红莉栖日文 + 本地 Ollama 翻译
P4 长期记忆        ⬜ 待做
P5 情感分析        ⬜ 待做
```

---

## 架构

```
 前端 (localhost:3000)          后端 (localhost:8000)        外部服务
 ┌──────────────────┐        ┌─────────────────────┐     ┌──────────────┐
 │ Live2D 红莉栖     │        │ FastAPI               │     │ DeepSeek API  │
 │ 聊天界面           │  SSE   │  /chat  → LLM 流式    │────→│ (对话生成)     │
 │                    │◄───────│  /tts   → 翻译 + 合成  │     └──────────────┘
 │ 打字显示(中文)      │        │         │              │
 │ 音频播放 + 口型     │  WAV   │  translator           │     ┌──────────────┐
 │                    │◄───────│    │ (中文→日文)        │────→│ Ollama qwen   │
 └──────────────────┘        │    ↓                   │     │ (本地翻译)     │
                              │  GPT-SoVITS (9880)     │     └──────────────┘
                              │    ↓                   │
                              │  红莉栖日语 WAV         │
                              └─────────────────────┘
```

---

## 快速启动

需要 **3 个终端**（建议全部用 VSCode 内嵌终端）：

### 终端 1：GPT-SoVITS TTS（PowerShell）

```powershell
cd D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50

runtime\python.exe api.py -s "D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50\SoVITS_weights_v4\Amadeus_e10_s4860_l32.pth" -g "D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50\GPT_weights_v4\Amadeus-e15.ckpt" -dr "D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50\output\slicer_opt\crs_0130wav.wav_0000121280_0000241600.wav" -dt "マキセ・クリスです。改めまして、よろしく。" -dl ja -mt wav -d cuda -hp
```

看到 `Uvicorn running on :9880` 即就绪。

### 终端 2：Amadeus 后端（PowerShell）

```powershell
conda activate amadeus
cd D:\Amadeus\backend
python -m app.main
```

看到 `Uvicorn running on :8000` 即就绪。

### 终端 3：前端（WSL bash）

```bash
cd /mnt/d/Amadeus/frontend
python -m http.server 3000
```

### 访问

浏览器打开 `http://localhost:3000`

### 停止

各终端按 `Ctrl+C`。

---

## 服务端口一览

| 端口 | 服务 | 用途 |
|------|------|------|
| 3000 | 前端 | 静态页面 + Live2D |
| 8000 | 后端 | FastAPI /chat + /tts |
| 9880 | GPT-SoVITS | 红莉栖语音合成 |
| 11434 | Ollama | 本地中→日翻译 (Windows 自启) |

---

## 环境要求

| 组件 | 说明 |
|------|------|
| Python | conda env `amadeus` (后端) + `runtime/python.exe` (TTS) |
| Ollama | Windows 端，模型 `qwen2.5:0.5b`，需设 `OLLAMA_NUM_GPU=999` |
| GPU | NVIDIA RTX 5060 (8GB)，同时跑 Ollama + GPT-SoVITS |
| API Key | DeepSeek，配置在 `backend/.env` |

---

## 目录结构

```
Amadeus/
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── main.py                 # 路由入口
│   │   ├── config.py               # 配置管理 (.env)
│   │   ├── agent/
│   │   │   ├── llm_client.py       # LLM 流式/非流式调用
│   │   ├── tts/
│   │   │   ├── gpt_sovits.py       # GPT-SoVITS API 封装
│   │   │   └── translator.py       # Ollama 中文→日文翻译
│   │   ├── memory/                 # (P4 待做)
│   │   └── emotion/                # (P5 待做)
│   ├── requirements.txt
│   ├── .env.example                # API Key 模板
│   └── start.sh                    # WSL 启动脚本
├── frontend/                    # 纯静态前端
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js                 # 入口协调
│   │   ├── live2d/live2d-render.js # Live2D 渲染 + 表情
│   │   ├── chat/chat-core.js       # 聊天 + SSE 流式
│   │   └── tts/audio_player.js     # 音频播放 + 口型
│   └── assets/live2d-model/        # 红莉栖模型
└── README.md
```

---

## 学习路线

| 阶段 | 内容 | 关键概念 |
|------|------|----------|
| P0 | Live2D + FastAPI 骨架 | 前后端分离、CORS、PixiJS |
| P1 | LLM 真实对话 | HTTP POST、API Key 管理、异步 fetch |
| P2 | SSE 流式响应 | StreamingResponse、ReadableStream、TextDecoder |
| P3 | TTS 语音合成 | GPT-SoVITS、Ollama 本地翻译、Web Audio API、口型同步 |

---

## 开发者

Sleepwishing + Hermes助手
