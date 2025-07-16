#!/usr/bin/env python3
"""
快速注册功能测试脚本
用于验证注册API是否正常工作
"""

import requests
import json

BASE_URL = "http://127.0.0.1:9999"

def test_registration_flow():
    """测试完整的注册流程"""
    print("🧪 开始测试注册功能...")
    
    # 测试邮箱
    test_email = "test@example.com"
    test_name = "测试用户"
    test_password = "123456"
    
    try:
        # 1. 发送验证码
        print(f"📧 发送验证码到: {test_email}")
        send_code_response = requests.post(f"{BASE_URL}/register/send_code", 
                                         json={"email": test_email})
        
        if send_code_response.status_code == 200:
            result = send_code_response.json()
            print(f"✅ 验证码发送成功: {result['message']}")
            
            # 提取验证码（从消息中解析）
            import re
            code_match = re.search(r'测试验证码: (\d+)', result['message'])
            if code_match:
                verification_code = code_match.group(1)
                print(f"🔑 获取到验证码: {verification_code}")
                
                # 2. 尝试注册
                print(f"📝 开始注册用户: {test_name}")
                register_data = {
                    "name": test_name,
                    "email": test_email,
                    "verification_code": verification_code,
                    "password": test_password,
                    "confirm_password": test_password
                }
                
                register_response = requests.post(f"{BASE_URL}/register/submit", 
                                                json=register_data)
                
                if register_response.status_code == 200:
                    result = register_response.json()
                    if result.get('success'):
                        print(f"🎉 注册成功!")
                        print(f"   用户名: {result.get('username')}")
                        print(f"   Token: {result.get('token')}")
                        
                        # 3. 测试登录
                        print(f"🔐 测试新用户登录...")
                        login_response = requests.post(f"{BASE_URL}/auth/login",
                                                     json={"username": test_email, 
                                                          "password": test_password})
                        
                        if login_response.status_code == 200:
                            login_result = login_response.json()
                            if login_result.get('success'):
                                print(f"✅ 登录成功!")
                                print(f"   消息: {login_result.get('message')}")
                            else:
                                print(f"❌ 登录失败: {login_result.get('message')}")
                        else:
                            print(f"❌ 登录请求失败: {login_response.status_code}")
                            
                    else:
                        print(f"❌ 注册失败: {result.get('message')}")
                else:
                    print(f"❌ 注册请求失败: {register_response.status_code}")
                    print(f"   响应: {register_response.text}")
            else:
                print("❌ 无法从响应中提取验证码")
        else:
            print(f"❌ 发送验证码失败: {send_code_response.status_code}")
            print(f"   响应: {send_code_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到测试服务器")
        print("   请确保测试服务器运行在 http://127.0.0.1:9999")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")

def test_server_status():
    """测试服务器状态"""
    print("\n🔍 检查服务器状态...")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print("✅ 服务器运行正常")
            print(f"   消息: {data.get('message')}")
            print(f"   端口: {data.get('port')}")
            print(f"   已注册用户: {data.get('registered_users')}")
            print(f"   已发送验证码: {data.get('verification_codes_sent')}")
            return True
        else:
            print(f"❌ 服务器响应异常: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器")
        return False

def test_debug_endpoint():
    """测试调试接口"""
    print("\n🐛 检查调试接口...")
    
    try:
        response = requests.get(f"{BASE_URL}/debug/codes")
        if response.status_code == 200:
            data = response.json()
            print("✅ 调试接口正常")
            print(f"   验证码数量: {len(data.get('verification_codes', {}))}")
            print(f"   注册用户数量: {len(data.get('registered_users', []))}")
            if data.get('registered_users'):
                print(f"   注册用户: {', '.join(data['registered_users'])}")
        else:
            print(f"❌ 调试接口异常: {response.status_code}")
    except Exception as e:
        print(f"❌ 调试接口测试失败: {e}")

if __name__ == "__main__":
    print("🚀 注册功能快速测试")
    print("=" * 50)
    
    # 检查服务器状态
    if test_server_status():
        # 测试调试接口
        test_debug_endpoint()
        
        # 测试注册流程
        test_registration_flow()
        
        print("\n" + "=" * 50)
        print("🎯 测试完成！")
        print("📋 可以在浏览器中测试: http://localhost:8000/register.html")
        print("🔍 查看调试信息: http://127.0.0.1:9999/debug/codes")
    else:
        print("\n❌ 服务器未运行，请先启动测试服务器:")
        print("   cd login_test && python3 test_server.py") 