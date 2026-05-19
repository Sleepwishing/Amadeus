/**
 * Amadeus Live2D 渲染器
 * 基于 pixi-live2d-display + PixiJS v6
 * 支持：模型加载、眼球追踪、自动呼吸、口型同步、表情切换
 */
class Live2DRenderer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.app = null;
        this.model = null;
        this.isInitialized = false;
        
        // 情感状态
        this.emotion = 'neutral';
        
        // 动画循环
        this.blinkTimer = 0;
        this.blinkState = 0; // 0=开眼 1=闭眼
        this.nextBlink = Math.random() * 200 + 150;
        this.breathPhase = 0;
        
        // 鼠标跟踪
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetEyeX = 0;
        this.targetEyeY = 0;
        this.currentEyeX = 0;
        this.currentEyeY = 0;
        
        // 口型同步
        this.mouthOpen = 0;
        this.targetMouthOpen = 0;
    }

    async init() {
        if (!this.canvas) {
            console.error('[Live2D] 找不到 canvas:', this.canvasId);
            return false;
        }

        try {
            const parent = this.canvas.parentElement;
            
            this.app = new PIXI.Application({
                view: this.canvas,
                width: parent.clientWidth,
                height: parent.clientHeight,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            window.addEventListener('resize', () => this.onResize());
            document.addEventListener('mousemove', (e) => this.onMouseMove(e));
            
            console.log('[Live2D] 渲染器初始化完成');
            this.isInitialized = true;
            return true;
        } catch (err) {
            console.error('[Live2D] 初始化失败:', err);
            return false;
        }
    }

    async loadModel(modelPath) {
        if (!this.app) return false;
        
        try {
            console.log('[Live2D] 正在加载模型:', modelPath);
            
            const model = await PIXI.live2d.Live2DModel.from(modelPath);
            this.model = model;
            
            // 居中定位
            model.anchor.set(0.5, 0.5);
            this.centerModel();
            
            // 设置缩放（根据屏幕大小调整）
            this._originalWidth = model.width;
            this._originalHeight = model.height;
            this.updateScale();
            
            this.app.stage.addChild(model);
            
            // 启动动画循环
            this.app.ticker.add(() => this.onTick());
            
            // 尝试播放待机动作
            this.playMotion('idle');
            
            console.log('[Live2D] 模型加载完成:', model);
            return true;
        } catch (err) {
            console.error('[Live2D] 模型加载失败:', err);
            this.showError(err.message);
            return false;
        }
    }

    centerModel() {
        if (!this.model || !this.app) return;
        this.model.position.set(
            this.app.screen.width / 2,
            this.app.screen.height / 2
        );
    }

    updateScale() {
        if (!this.model || !this.app) return;

        // 用原始尺寸计算，避免缩放递归问题
        const baseW = this._originalWidth || this.model.width;
        const baseH = this._originalHeight || this.model.height;

        const canvasW = this.app.screen.width;
        const canvasH = this.app.screen.height;

        // 等比例缩放：完整显示在画布内（contain 模式），留 10% 边距
        const scale = Math.min(
            (canvasW * 0.9) / baseW,
            (canvasH * 0.9) / baseH,
        );

        this.model.scale.set(scale);
    }

   onResize() {
        if (!this.app) return;
        const parent = this.canvas.parentElement;
        this.app.renderer.resize(parent.clientWidth, parent.clientHeight);

        if (this.model) {
            this.model.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
            this.updateScale(); 
        }
    }

    onMouseMove(e) {
        // 计算鼠标相对于画布中心的位置 (-1 ~ 1)
        const rect = this.canvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        this.mouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
        this.mouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
    }

    onTick() {
        if (!this.model) return;
        
        const core = this.model.internalModel.coreModel;
        const dt = 1; // 每帧约1/60秒

        // === 1. 眼球追踪（带滑动）===
        this.targetEyeX = this.mouseX;
        this.targetEyeY = -this.mouseY; // Y轴要反向
        this.currentEyeX += (this.targetEyeX - this.currentEyeX) * 0.1;
        this.currentEyeY += (this.targetEyeY - this.currentEyeY) * 0.1;
        
        core.setParameterValueById('ParamEyeBallX', this.currentEyeX);
        core.setParameterValueById('ParamEyeBallY', this.currentEyeY);

        // === 2. 自动呼吸 ===
        this.breathPhase += 0.03;
        const breath = Math.sin(this.breathPhase) * 0.3 + 0.5;
        core.setParameterValueById('ParamBreath', breath);

        // === 3. 自动眨眼 ===
        this.blinkTimer += 1;
        if (this.blinkState === 0 && this.blinkTimer > this.nextBlink) {
            this.blinkState = 1;
            this.blinkTimer = 0;
        } else if (this.blinkState === 1 && this.blinkTimer > 6) {
            this.blinkState = 0;
            this.blinkTimer = 0;
            this.nextBlink = Math.random() * 200 + 150;
        }
        const eyeOpen = this.blinkState === 1 ? 0.1 : 1.0;
        core.setParameterValueById('ParamEyeROpen', eyeOpen);

        // === 4. 口型同步（用于 TTS 播放时）===
        this.currentMouthOpen += (this.targetMouthOpen - (this.currentMouthOpen || 0)) * 0.3;
        core.setParameterValueById('ParamMouthOpenY', this.currentMouthOpen || 0);
    }

    // ========== 表情控制 ==========
    setExpression(expression) {
        if (!this.model) return;
        this.emotion = expression;
        const core = this.model.internalModel.coreModel;
        
        switch (expression) {
            case 'happy':
                core.setParameterValueById('ParamEyeRSmile', 1.0);  // 眯眼笑
                core.setParameterValueById('Param9', 0.3);          // 微红
                core.setParameterValueById('ParamMouthForm', 1.0);  // 微笑嘴
                break;
            case 'sad':
                core.setParameterValueById('ParamEyeRSmile', 0);
                core.setParameterValueById('Param9', 0);
                core.setParameterValueById('ParamMouthForm', -0.5);
                break;
            case 'angry':
                core.setParameterValueById('ParamEyeRSmile', 0);
                core.setParameterValueById('Param9', 0.6);          // 气红了
                core.setParameterValueById('ParamMouthForm', -0.3);
                break;
            case 'surprised':
                core.setParameterValueById('ParamEyeRSmile', 0);
                core.setParameterValueById('Param9', 0.1);
                core.setParameterValueById('ParamMouthForm', 0.5);
                break;
            case 'thinking':
                core.setParameterValueById('Param8', 1.0);          // 思考表情
                core.setParameterValueById('Param6', 1.0);          // 思考姿势
                break;
            case 'neutral':
            default:
                core.setParameterValueById('ParamEyeRSmile', 0);
                core.setParameterValueById('Param9', 0);
                core.setParameterValueById('ParamMouthForm', 0);
                core.setParameterValueById('Param8', 0);
                core.setParameterValueById('Param6', 0);
                break;
        }
        console.log('[Live2D] 切换表情:', expression);
    }

    // ========== 动作播放 ==========
    playMotion(motionName) {
        if (!this.model) return;
        try {
            this.model.motion(motionName);
            console.log('[Live2D] 播放动作:', motionName);
        } catch (err) {
            console.warn('[Live2D] 动作播放失败:', motionName, err);
        }
    }

    // ========== 口型同步（TTS 用）==========
    setMouthOpen(value) {
        /** value: 0.0 ~ 1.0 */
        this.targetMouthOpen = Math.max(0, Math.min(1, value));
    }

    // ========== 错误提示 ==========
    showError(msg) {
        if (!this.app) return;
        const style = new PIXI.TextStyle({
            fontFamily: 'Microsoft YaHei',
            fontSize: 16,
            fill: '#ff6b6b',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 400
        });
        const text = new PIXI.Text('❌ 模型加载失败\n' + msg, style);
        text.anchor.set(0.5);
        text.x = this.app.screen.width / 2;
        text.y = this.app.screen.height / 2;
        this.app.stage.addChild(text);
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true);
            this.app = null;
            this.model = null;
        }
    }
}
