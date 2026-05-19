#!/bin/bash
# Amadeus 后端启动脚本 (WSL 专用)
# 使用集中管理的 venv：~/.venvs/amadeus

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 激活集中环境
if [ ! -d "$HOME/.venvs/amadeus" ]; then
    echo "❌ 找不到 venv: ~/.venvs/amadeus"
    echo "请先运行: /usr/bin/python3 -m venv ~/.venvs/amadeus"
    exit 1
fi

source "$HOME/.venvs/amadeus/bin/activate"

# 安装/更新依赖
echo "📦 检查依赖..."
pip install -q -r requirements.txt

echo "✅ 启动 FastAPI 服务..."
echo "🌐 访问 http://localhost:8000/docs 查看 API 文档"
echo "按 Ctrl+C 停止服务"
echo ""

python -m app.main
