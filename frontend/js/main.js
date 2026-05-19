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
    window.amadeus = { live2d, chat };
    
    console.log('🎉 Amadeus 启动完成！');
})();
