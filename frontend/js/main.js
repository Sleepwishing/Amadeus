/**
 * Amadeus 前端入口
 * 协调 Live2D 渲染器和聊天核心
 */
(async function() {
    console.log('🎨 Amadeus 正在启动...');

    // 初始化 Live2D 渲染器
    const live2d = new Live2DRenderer('live2d-canvas');
    const live2dOk = await live2d.init();
    
    if (live2dOk) {
        console.log('✅ Live2D 已就绪');
        // 加载 Amadeus 模型
        await live2d.loadModel('./assets/live2d-model/live2d/amadeusV1.model3.json');
    } else {
        console.error('❌ Live2D 初始化失败');
    }

    // 初始化聊天系统
    const chat = new ChatCore();
    
    // 检查后端状态
    await chat.checkBackend();
    
    // 每 5 秒重试后端连接（如果刚开始没连上）
    if (!chat.isReady) {
        const retryInterval = setInterval(async () => {
            await chat.checkBackend();
            if (chat.isReady) clearInterval(retryInterval);
        }, 5000);
    }

    // 将实例挂载到 window 便于调试
    const audio = new AudioPlayer();

    // 绑定口型同步：Live2D 嘴巴跟着声音动
    audio.onMouthUpdate = (value) => {
        if (live2d.model) {
            live2d.setMouthOpen(value);
        }
    };
    audio.onSpeakingEnd = () => {
        // 播放结束，显示思考表情（后续 P5 会根据情感切换）
        live2d.setExpression('neutral');
    };

    window.amadeus = { live2d, chat, audio };
    
    console.log('🎉 Amadeus 启动完成！');
})();
