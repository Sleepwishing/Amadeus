/**
 * Amadeus 音频播放器
 * 负责：接收 /tts 返回的 WAV 音频 → 浏览器解码 → 播放 → 口型同步回调
 */
class AudioPlayer {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.audioContext = null;    // Web Audio API 上下文
        this.isPlaying = false;      // 是否正在播放
        this.onSpeakingStart = null; // 回调：张嘴
        this.onSpeakingEnd = null;   // 回调：闭嘴
        this.onMouthUpdate = null;   // 回调：(value) 口型大小
        this.mouthInterval = null;   // 口型动画定时器
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
     * 合成并播放语音
     * 后端自动将中文翻译为日文后调用 GPT-SoVITS 合成
     * @param {string} text - 要播放的文字（中文即可）
     */
    async speak(text) {
        if (!text || !this.audioContext) return;

        try {
            // 调用后端 /tts 接口（后端自动翻译日文 + 合成语音）
            const res = await fetch(`${this.API_BASE}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

            // 2. 获取音频二进制数据
            const arrayBuffer = await res.arrayBuffer();

            // 3. 解码为 AudioBuffer
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // 4. 播放
            this.playBuffer(audioBuffer);

        } catch (err) {
            console.error('[Audio] TTS 播放失败:', err);
        }
    }

    /**
     * 播放已解码的 AudioBuffer
     * 同时驱动口型动画，模拟说话时的张嘴动作
     */
    playBuffer(audioBuffer) {
        // 停止之前的口型动画
        this.stopMouthAnimation();

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        // 触发张嘴回调
        this.isPlaying = true;
        this.onSpeakingStart?.();

        // 播放结束时自动闭嘴
        source.onended = () => {
            this.isPlaying = false;
            this.stopMouthAnimation();
            this.onSpeakingEnd?.();
        };

        source.start();

        // 启动口型动画：每 100ms 随机调整张嘴幅度
        // 真正的口型同步需要 GPT-SoVITS 返回时间戳，这是简化版
        this.startMouthAnimation();

        console.log(`[Audio] 播放中，时长: ${audioBuffer.duration.toFixed(1)}s`);
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
