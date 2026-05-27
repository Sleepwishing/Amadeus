/**
 * Amadeus 音频播放器
 * 负责：接收 /tts 返回的 WAV 音频 → 浏览器解码 → 播放 → 口型同步回调
 */
class AudioPlayer {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.audioContext = null;
        this.isPlaying = false;
        this.onSpeakingStart = null;
        this.onSpeakingEnd = null;
        this.onMouthUpdate = null;
        this.mouthInterval = null;

        // === P3 分句流式：播放队列 ===
        this.queue = [];            // ["句子1", "句子2", ...]
        this.isProcessing = false;  // 是否正在依次播放队列
    }

    /**
     * 初始化 AudioContext
     * 必须在用户交互（点击、按键）后调用，浏览器自动播放策略要求
     */
    init() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[Audio] AudioContext 已创建，采样率:', this.audioContext.sampleRate);
    }

    /**
     * 加入播放队列（分句流式 TTS 入口）
     * 前端切句后调用，自动排队 + 顺序播放
     * @param {string} text - 单句话（中文即可）
     */
    enqueue(text) {
        if (!text || !text.trim()) return;
        this.init();
        this.queue.push(text.trim());

        // 如果没在处理，立即启动队列消费
        if (!this.isProcessing) {
            this._processQueue();
        }

        console.log(`[Audio] 入队: ${text.slice(0, 20)}... 队列长度: ${this.queue.length}`);
    }

    /**
     * 依次消费队列：取第一句 → 合成+播放 → 等播完 → 取下一句
     */
    async _processQueue() {
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const text = this.queue.shift();
            await this.speak(text);   // speak 现在是 async，播放结束才 resolve
        }

        this.isProcessing = false;
    }

    /**
     * 合成 + 播放一句（内部方法，由 processQueue 调用）
     */
    async speak(text) {
        if (!text || !this.audioContext) return;

        try {
            // 1. 调后端 /tts（翻译 + 合成）
            const res = await fetch(`${this.API_BASE}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

            // 2. 获取音频二进制
            const arrayBuffer = await res.arrayBuffer();

            // 3. 解码
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // 4. 等待播放完成（playBuffer 返回 Promise）
            await this.playBuffer(audioBuffer);

        } catch (err) {
            console.error('[Audio] TTS 播放失败:', err);
        }
    }

    /**
     * 播放已解码的 AudioBuffer，返回 Promise（播放结束时 resolve）
     */
    playBuffer(audioBuffer) {
        return new Promise((resolve) => {
            this.stopMouthAnimation();

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            this.isPlaying = true;
            this.onSpeakingStart?.();

            source.onended = () => {
                this.isPlaying = false;
                this.stopMouthAnimation();
                this.onSpeakingEnd?.();
                resolve();   // ← 关键：播放结束，让队列继续
            };

            source.start();
            this.startMouthAnimation();

            console.log(`[Audio] 播放中，时长: ${audioBuffer.duration.toFixed(1)}s`);
        });
    }

    /**
     * 启动口型动画（简化版：随机张嘴）
     */
    startMouthAnimation() {
        this.mouthInterval = setInterval(() => {
            // 模拟说话时的口型变化：在 0.1 ~ 0.7 之间波动
            const value = 0.15 + Math.random() * 0.55;
            this.onMouthUpdate?.(value);
        }, 100);
    }

    /**
     * 停止口型动画
     */
    stopMouthAnimation() {
        if (this.mouthInterval) {
            clearInterval(this.mouthInterval);
            this.mouthInterval = null;
        }
        this.onMouthUpdate?.(0);  // 闭嘴
    }

    /**
     * 销毁资源
     */
    destroy() {
        this.stopMouthAnimation();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
