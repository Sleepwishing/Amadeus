# Amadeus - AI Agent System

一个搭载 Live2D 模型、TTS 语音合成、长期记忆、情感分析的 AI Agent 系统。

> 边做边学的项目，每个阶段都是可运行、可看到效果的完整循环。

---

## 快速启动（P0 骨架）

### 1. 安装依赖

需要：Python 3.10+, Node.js（可选，前端用静态文件）

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cd backend
copy .env.example .env
# 用 VSCode 编辑 .env，填入你的 LLM API 密钥
```

### 3. 启动后端

```bash
# 方式一：直接运行
python -m app.main

# 方式二：Windows 一键启动
start.bat
```

后端启动后，访问 http://localhost:8000/docs 可见 API 文档。

### 4. 打开前端

前端是纯静态文件，两种方式打开：

方式一：直接用浏览器打开 `frontend/index.html`

方式二：用 Python 启动本地服务（推荐，避免跨域问题）

```bash
cd frontend
python -m http.server 3000
# 然后访问 http://localhost:3000
```

### 5. 看到的效果

- 左侧：Live2D 渲染区域（待放入模型）
- 右侧：聊天界面
- 底部：系统状态栏

---

## 学习路线

### P0 骨架搭建 ✅

**目标**：让前后端跑起来，前端看到 Live2D 占位和聊天界面。

**学习点**：
- FastAPI 基础路由、中间件
- PixiJS 绘图基础
- 前后端分离架构

### P1 基础聊天

**目标**：输入文字，真正调用 LLM 获取回复。

**需要做**：
1. 在 `backend/app/agent/` 创建 LLM 调用模块
2. 在 `main.py` 添加 `/chat` POST 接口
3. 在 `frontend/js/chat/chat-core.js` 替换 `simulateResponse` 为真实调用

**学习点**：
- HTTP 请求 / 响应
- API 密钥管理
- 异步 JavaScript (fetch/async-await)

### P2 流式响应

**目标**：实现打字机效果，LLM 一字一字出现。

**需要做**：
1. 后端支持 SSE (Server-Sent Events) 流式传输
2. 前端接收流并逐字渲染

**学习点**：
- SSE 流式传输原理
- 前端流式渲染优化

### P3 TTS 语音

**目标**：Amadeus 能说话，文字转为语音。

**需要做**：
1. 在 `backend/app/tts/` 集成 edge-tts
2. 添加 `/tts` 接口，返回音频文件
3. 前端播放音频，与文字动画同步

**学习点**：
- 语音合成原理
- 音频播放 API
- 异步穿流处理

### P4 长期记忆

**目标**：她能记住你们聊过什么，理解上下文。

**需要做**：
1. 用 SQLite 存储对话历史
2. 用 Chroma 做语义检索
3. 每次对话前，检索相关记忆作为上下文

**学习点**：
- 向量数据库基础
- RAG (检索增强生成)
- 提示词工程 (Prompt Engineering)

### P5 情感与表情联动

**目标**：根据对话内容判断情绪，切换 Live2D 表情。

**需要做**：
1. 分析回复文本的情感倾向
2. 将情感映射到 Live2D 表情 / 动作
3. TTS 语气跟随情感变化

**学习点**：
- 情感分析 (NLP)
- 状态机 / 事件驱动架构
- Live2D 表情控制

---

## 目录结构说明

```
Amadeus/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── main.py               # FastAPI 入口
│   │   ├── config.py             # 配置管理
│   │   ├── agent/                # LLM 交互核心 (P1-P2)
│   │   ├── tts/                  # 语音合成 (P3)
│   │   ├── memory/               # 记忆系统 (P4)
│   │   └── emotion/              # 情感分析 (P5)
│   ├── requirements.txt
│   ├── .env                      # API 密钥等敏感配置（不提交到 git）
│   └── start.bat                 # Windows 一键启动
├── frontend/                   # 前端界面
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js               # 入口
│   │   ├── live2d/               # Live2D 渲染 (P0, P5)
│   │   ├── chat/                 # 聊天逻辑 (P1-P2)
│   │   └── tts/                  # 语音播放 (P3)
│   └── assets/
│       └── live2d-model/         # 放模型文件
└── docs/                       # 学习笔记
```

---

## 推荐的 Live2D 模型获取

1. **免费模型**：[Booth](https://booth.pm) 搜索 "Live2D 無料"
2. **官方示例**：[Live2D 官方 GitHub](https://github.com/Live2D)
3. **简易模型**：用 Live2D Cubism Editor 自己画一个

放入 `frontend/assets/live2d-model/` 后，修改 `js/live2d/live2d-render.js` 中的 `loadModel()` 方法。

---

## 常见问题

**Q: 前端请求后端跨域失败？**
A: 确保后端已启动，并且 CORS 中间件已开启。前端用本地服务打开而不是文件协议。

**Q: TTS 播放没声音？**
A: 浏览器需要用户交互才能自动播放音频，第一次需要点击页面。

**Q: LLM 回复很慢？**
A: 检查网络延迟。流式输出会比等待完整响应更流畅。

---

## 开发者

Sleepwishing + Hermes 助手
