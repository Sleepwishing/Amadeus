@echo off
chcp 65001 >nul
title Amadeus 一键启动

echo.
echo ╔══════════════════════════════════════╗
echo ║    🚀 Amadeus AI Agent 启动中...     ║
echo ╚══════════════════════════════════════╝
echo.

REM ============================================
REM 1. GPT-SoVITS TTS 语音合成服务
REM ============================================
echo [1/3] 🎤 启动 GPT-SoVITS TTS (端口 9880)...
start "GPT-SoVITS TTS" powershell -NoExit -Command ^
  "cd D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50; ^
   runtime\python.exe api.py ^
   -s D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50\SoVITS_weights_v4\Amadeus_e10_s4860_l32.pth ^
   -g D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50\GPT_weights_v4\Amadeus-e15.ckpt ^
   -dr D:\TTS\GPT-SoVITS-v2pro\GPT-SoVITS-v2pro-20250604-nvidia50\output\slicer_opt\crs_0130wav.wav_0000121280_0000241600.wav ^
   -dt 'マキセ・クリスです。改めまして、よろしく。' ^
   -dl ja ^
   -mt wav"

echo     ⏳ 等待 TTS 模型加载（15 秒，仅首次需要）...
timeout /t 15 /nobreak >nul

REM ============================================
REM 2. Amadeus 后端 FastAPI
REM ============================================
echo [2/3] 🧠 启动 Amadeus 后端 (端口 8000)...
start "Amadeus Backend" powershell -NoExit -Command ^
  "conda activate amadeus; ^
   cd D:\Amadeus\backend; ^
   python -m app.main"
timeout /t 3 /nobreak >nul

REM ============================================
REM 3. 前端静态服务
REM ============================================
echo [3/3] 🌐 启动前端 (端口 3000)...
start "Amadeus Frontend" powershell -NoExit -Command ^
  "cd D:\Amadeus\frontend; ^
   python -m http.server 3000"

echo.
echo ╔══════════════════════════════════════╗
echo ║       ✅ 全部启动完成！              ║
echo ╠══════════════════════════════════════╣
echo ║  后端 API  http://localhost:8000/docs║
echo ║  前端页面  http://localhost:3000     ║
echo ║  TTS 服务  http://localhost:9880     ║
echo ╚══════════════════════════════════════╝
echo.
echo Ollama 翻译模型: qwen2.5:0.5b (自动随 Windows 启动)
echo.
echo 💡 提示：各服务在独立窗口中运行，关掉窗口即停止
echo.
pause
