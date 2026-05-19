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

        // 显示等待状态
        const loadingMsg = this.addMessage('assistant', '思考中...');
        
        try {
            // TODO: P1 将在这里调用真实的 /chat 接口
            // 目前先模拟回复
            await this.simulateResponse(loadingMsg);
        } catch (err) {
            loadingMsg.textContent = '哎呀，出错了... 请稍后重试~';
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
