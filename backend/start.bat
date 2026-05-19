@echo off
chcp 65001 >nul
echo 🚀 正在启动 Amadeus 后端服务...

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist venv (
    echo 📦 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装依赖
echo 📦 安装依赖...
pip install -r requirements.txt

REM 启动服务
echo ✅ 启动 FastAPI 服务...
echo 🌐 访问 http://localhost:8000/docs 查看 API 文档
python -m app.main

pause
