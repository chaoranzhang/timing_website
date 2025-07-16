#!/usr/bin/env python3
"""
启动 Timing 登录测试服务器
"""

import subprocess
import sys
import os

def check_dependencies():
    """检查依赖是否已安装"""
    try:
        import fastapi
        import uvicorn
        print("✅ 依赖检查通过")
        return True
    except ImportError as e:
        print(f"❌ 缺少依赖: {e}")
        print("💡 请运行: pip install -r requirements.txt")
        return False

def main():
    print("🚀 Timing 登录测试服务器启动器")
    print("=" * 40)
    
    # 检查依赖
    if not check_dependencies():
        return
    
    # 启动服务器
    try:
        print("🌐 启动测试服务器...")
        subprocess.run([sys.executable, "test_server.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == "__main__":
    main() 