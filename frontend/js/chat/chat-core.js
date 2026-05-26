/**
 * 聊天核心逻辑
 * 负责与后端通信、消息渲染、状态管理
 */
class ChatCore {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.isReady = false;
        
        this.bindEvents();
    }

    bindEvents() {
        // 发送消息
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async checkBackend() {
        /** 检查后端服务状态 */
        try {
            const res = await fetch(`${this.API_BASE}/health`);
            const data = await res.json();
            
            if (data.status === 'ok') {
                this.setReady(true);
                this.setStatus('online', '后端已连接');
            }
        } catch (err) {
            this.setReady(false);
            this.setStatus('error', '后端未响应，请运行 backend/start.bat');
            console.warn('[Chat] 后端检查失败:', err);
        }
    }

    setReady(ready) {
        this.isReady = ready;
        this.input.disabled = !ready;
        this.sendBtn.disabled = !ready;
        
        if (ready) {
            this.addMessage('system', '🎉 系统就绪！可以开始聊天了~');
        }
    }

    setStatus(type, text) {
        this.statusDot.className = '';
        this.statusDot.classList.add(type);
        this.statusText.textContent = text;
    }

    addMessage(role, content) {
        /** 添加消息到聊天界面 */
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.textContent = content;
        this.messagesContainer.appendChild(div);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return div;
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text || !this.isReady) return;

        // 清空输入框并显示用户消息
        this.input.value = '';
        this.addMessage('user', text);

        // 显示等待状态（这个 div 之后会被替换成真实回复）
        const loadingMsg = this.addMessage('assistant', '思考中...');
        
        try {
            // === P2: 流式接收 SSE 响应 ===

            // 1. 发送 POST 请求
            const res = await fetch(`${this.API_BASE}/chat`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: text})
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            // 2. 获取 ReadableStream 阅读器
            // res.body 是一个 ReadableStream，可以逐块读取
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';          // 缓冲区，用于组装不完整的 SSE 行
            let fullReply = '';       // 累积完整回复

            // 清空"思考中..."，准备接收流
            loadingMsg.textContent = '';
            loadingMsg.classList.add('streaming');  // 可加一个 CSS 动画标识

            // 3. 循环读取数据流
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;   // 流结束

                // 将二进制块解码为字符串
                buffer += decoder.decode(value, {stream: true});

                // 按 \n 分割每一行
                const lines = buffer.split('\n');
                buffer = lines.pop();  // 最后一行可能不完整，留到下次处理

                for (const line of lines) {
                    // SSE 行格式：data: {"chunk": "xxx"}
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);

                        // 结束标志
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            const chunk = data.chunk;
                            fullReply += chunk;
                            loadingMsg.textContent = fullReply;
                            // 自动滚动到最底
                            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                        } catch (e) {
                            // 解析失败忽略（稀有）
                            console.warn('[Chat] 解析 SSE 数据失败:', line);
                        }
                    }
                }
            }

            // 处理最后留在 buffer 里的残留数据
            if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(buffer.slice(6));
                    if (data.chunk) {
                        fullReply += data.chunk;
                        loadingMsg.textContent = fullReply;
                    }
                } catch (e) { /* 忽略 */ }
            }

            // === P3: 流式结束后，调用 TTS 播放语音 ===
            // 后端会自动翻译成日文再合成，前端只需传中文文本
            if (fullReply && window.amadeus && window.amadeus.audio) {
                window.amadeus.audio.init();
                window.amadeus.audio.speak(fullReply);
            }

        } catch (err) {
            loadingMsg.textContent = '哎呀，出错了... 请检查后端日志或 .env 配置';
            console.error('[Chat] 发送失败:', err);
        }
    }

    async simulateResponse(element) {
        /** P0 占位回复 - P1 将替换为真实流式调用 */
        const replies = [
            '哼，源宝说的话我听到了。快把 LLM API 配置好，这些回复就能更聪明了。',
            '我是 Amadeus，物理学圣地研究所的级助理... 嘿嘿，开玩笑的，我还在学习中。',
            '这个设定超棒的！等 TTS 接好了，我就能真正与你对话了。El Psy Kongroo。',
            '人工智能的发展速度真是令人惊讶呢... 不过，有你一步一步搭建我，感觉也不坏。'
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        
        // 模拟打字效果
        element.textContent = '';
        for (let i = 0; i < reply.length; i++) {
            element.textContent += reply[i];
            await new Promise(r => setTimeout(r, 45));
        }
    }
}
