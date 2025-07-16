import uvicorn
import random

from enum import IntEnum
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timedelta

app = FastAPI()

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义请求数据结构
class BirthdayData(BaseModel):
    birthday: str = Field(..., description="Day of birth of the user")
    name: str
    email: str
    phone: str

# 定义时间值对的数据结构
class TimeValuePair(BaseModel):
    time: List[str]
    value: List[float]

# 定义响应数据结构
class AnalysisResponse(BaseModel):
    health: TimeValuePair
    career: TimeValuePair
    love: TimeValuePair


def generate_values():
    values = []
    value = 80
    for i in range(36500):
        values.append(value)
        random_number = random.randint(-5, 5)
        value += random_number
        value = max(60, min(value, 100))
    
    return values

health_value = generate_values()
career_value = generate_values()
love_value = generate_values()


def generate_smooth_luck_values(days=90, interval_hours=2):
    start_time = datetime.datetime.now()
    end_time = start_time + datetime.timedelta(days=days)
    
    current_time = start_time
    luck_value = 80  # 初始运势值（范围1-100）
    luck_data = []
    
    while current_time <= end_time:
        # 记录当前时间点的运势值
        luck_data.append({
            "timestamp": current_time.strftime("%m-%d %H:%M"),
            "luck_value": luck_value
        })
        
        # 生成小幅随机变化（-3到+3之间，避免突变）
        change = random.randint(-5, 5)
        luck_value += change
        
        # 确保运势值在1~100之间
        luck_value = max(60, min(luck_value, 100))
        
        # 进入下一个时间点
        current_time += datetime.timedelta(hours=interval_hours)
    
    return luck_data

def generate_time_series():
    """生成从今天起未来3个月（90天），每天每2小时一个时间点的时间序列"""
    start_date = datetime.now().replace(hour=1, minute=0, second=0, microsecond=0)
    days = 90
    times = []
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        for hour in range(0, 24, 2):
            time_point = current_date.replace(hour=hour, minute=0)
            times.append(time_point.strftime("%m-%d %H:%M"))
    return times

def generate_mock_data(data) -> AnalysisResponse:
    # 生成时间序列
    times = generate_time_series()
    
    date_string = data
    date_format = "%Y-%m-%d"
    date_object = datetime.strptime(date_string, date_format)
    # now_date_object = datetime.now()
    # dif = now_date_object - date_object

    start_idx = 10*date_object.year + 100*date_object.month + 10000*date_object.day
    start_idx = start_idx %  34000
    
    
    # 为每种类型创建时间和数值的映射
    def create_time_value_dict():
        values = []
        base = random.uniform(40, 60)  # 起始值
        for idx in range(len(times)):
            # 在前一个值基础上微调，波动范围小
            delta = random.uniform(-2, 2)
            base = min(80, max(20, base + delta))  # 保证在20~80之间
            values.append(round(base, 1))
        return {
            "time": times,
            "value": values
        }

    return {
        "health": {"time":times , "value": health_value[start_idx: start_idx+len(times)]},
        "career": {"time":times , "value": career_value[start_idx: start_idx+len(times)]},
        "love": {"time":times , "value": love_value[start_idx: start_idx+len(times)]}
    }

@app.post("/analyze/birthday", response_model=AnalysisResponse)
def analyze_birthday(data: BirthdayData):
    print(f"Received birthday: {data.birthday}")
    
    # 生成模拟数据
    analysis_data = generate_mock_data(data.birthday)
    
    return analysis_data

