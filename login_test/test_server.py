import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
import random
import string

app = FastAPI(title="Timing 登录注册测试服务器", version="1.0.0")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 登录请求模型
class LoginRequest(BaseModel):
    username: str
    password: str

# 登录响应模型
class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    username: Optional[str] = None
    name: Optional[str] = None

# 发送验证码请求模型
class SendCodeRequest(BaseModel):
    email: str

# 验证验证码请求模型
class ValidateCodeRequest(BaseModel):
    email: str
    verification_code: str

# 发送验证码响应模型
class SendCodeResponse(BaseModel):
    success: bool
    message: str

# 注册请求模型
class RegisterRequest(BaseModel):
    name: str
    email: str
    verification_code: str
    password: str
    confirm_password: str

# 注册响应模型
class RegisterResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    username: Optional[str] = None
    name: Optional[str] = None

# 模拟用户数据
TEST_USERS = {
    "admin@example.com": {
        "password": "123456",
        "name": "管理员"
    }
}

# 模拟验证码存储 (邮箱 -> 验证码)
VERIFICATION_CODES = {}

# 生成随机验证码
def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """用户登录接口"""
    username = request.username
    password = request.password
    
    print(f"收到登录请求: username={username}")
    
    # 验证用户名和密码
    if username in TEST_USERS and TEST_USERS[username]["password"] == password:
        user_data = TEST_USERS[username]
        return LoginResponse(
            success=True,
            message="登录成功",
            token=f"token_{username.split('@')[0]}",
            username=username.split('@')[0],  # 返回@前的部分作为用户名
            name=user_data["name"]  # 返回真实姓名
        )
    else:
        return LoginResponse(
            success=False,
            message="用户名或密码错误"
        )

@app.post("/register/send_code", response_model=SendCodeResponse)
async def send_verification_code(request: SendCodeRequest):
    """发送邮箱验证码"""
    email = request.email
    
    print(f"收到发送验证码请求: email={email}")
    
    # 检查邮箱是否已注册
    if email in TEST_USERS:
        return SendCodeResponse(
            success=False,
            message="该邮箱已注册，请直接登录"
        )
    
    # 生成验证码
    verification_code = generate_verification_code()
    VERIFICATION_CODES[email] = {
        "code": verification_code,
        "timestamp": time.time(),
        "used": False
    }
    
    print(f"为邮箱 {email} 生成验证码: {verification_code}")
    
    return SendCodeResponse(
        success=True,
        message=f"验证码已发送到 {email}，请查收（测试验证码: {verification_code}）"
    )

@app.post("/register/validate_code", response_model=SendCodeResponse)
async def validate_verification_code(request: ValidateCodeRequest):
    """验证验证码是否正确"""
    email = request.email
    verification_code = request.verification_code
    
    print(f"验证验证码请求: email={email}, code={verification_code}")
    
    # 检查验证码是否存在
    if email not in VERIFICATION_CODES:
        return SendCodeResponse(
            success=False,
            message="请先获取邮箱验证码"
        )
    
    verification_data = VERIFICATION_CODES[email]
    
    # 检查验证码是否正确
    if verification_data["code"] != verification_code:
        return SendCodeResponse(
            success=False,
            message="验证码错误"
        )
    
    # 检查验证码是否已使用
    if verification_data["used"]:
        return SendCodeResponse(
            success=False,
            message="验证码已使用"
        )
    
    # 检查验证码是否过期（10分钟）
    if time.time() - verification_data["timestamp"] > 600:
        return SendCodeResponse(
            success=False,
            message="验证码已过期"
        )
    
    return SendCodeResponse(
        success=True,
        message="验证码正确"
    )

@app.post("/register/submit", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """用户注册接口"""
    print(f"收到注册请求: email={request.email}, name={request.name}")
    
    # 检查邮箱是否已注册
    if request.email in TEST_USERS:
        return RegisterResponse(
            success=False,
            message="该邮箱已注册，请直接登录"
        )
    
    # 检查密码是否一致
    if request.password != request.confirm_password:
        return RegisterResponse(
            success=False,
            message="两次密码输入不一致"
        )
    
    # 检查验证码
    if request.email not in VERIFICATION_CODES:
        return RegisterResponse(
            success=False,
            message="请先获取邮箱验证码"
        )
    
    verification_data = VERIFICATION_CODES[request.email]
    
    # 检查验证码是否正确
    if verification_data["code"] != request.verification_code:
        return RegisterResponse(
            success=False,
            message="验证码错误，请重新输入"
        )
    
    # 检查验证码是否已使用
    if verification_data["used"]:
        return RegisterResponse(
            success=False,
            message="验证码已使用，请重新获取"
        )
    
    # 检查验证码是否过期（10分钟）
    if time.time() - verification_data["timestamp"] > 600:
        return RegisterResponse(
            success=False,
            message="验证码已过期，请重新获取"
        )
    
    # 注册成功，添加用户
    TEST_USERS[request.email] = {
        "password": request.password,
        "name": request.name
    }
    
    # 标记验证码已使用
    VERIFICATION_CODES[request.email]["used"] = True
    
    username = request.email.split('@')[0]
    
    print(f"注册成功: {request.email} -> {request.name}")
    
    return RegisterResponse(
        success=True,
        message="注册成功",
        token=f"token_{username}",
        username=username,
        name=request.name
    )

@app.get("/")
async def root():
    return {
        "message": "Timing 登录注册测试服务器运行中",
        "port": 9999,
        "test_account": {
            "username": "admin@example.com",
            "password": "123456"
        },
        "endpoints": [
            "POST /auth/login - 用户登录",
            "POST /register/send_code - 发送验证码",
            "POST /register/submit - 用户注册"
        ],
        "registered_users": len(TEST_USERS),
        "verification_codes_sent": len(VERIFICATION_CODES)
    }

@app.get("/debug/codes")
async def debug_codes():
    """调试接口：查看所有验证码"""
    return {
        "verification_codes": VERIFICATION_CODES,
        "registered_users": list(TEST_USERS.keys())
    }

if __name__ == "__main__":
    print("🚀 启动 Timing 登录注册测试服务器...")
    print("📋 测试账户: admin@example.com / 123456")
    print("🌐 服务器地址: http://127.0.0.1:9999")
    print("📖 API文档: http://127.0.0.1:9999/docs")
    print("🔍 调试接口: http://127.0.0.1:9999/debug/codes")
    uvicorn.run(app, host="127.0.0.1", port=9999) 