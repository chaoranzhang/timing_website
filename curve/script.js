// 生成模拟数据
function generateMockData() {
    const times = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // 生成90天，每2小时一个点的时间序列
    for (let day = 0; day < 90; day++) {
        for (let hour = 0; hour < 24; hour += 2) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day);
            date.setHours(hour);
            const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            times.push(timeStr);
        }
    }
    
    // 生成三条不同特征的曲线
    function generateCurveData(baseValue, trend, volatility) {
        const values = [];
        let current = baseValue;
        
        for (let i = 0; i < times.length; i++) {
            // 添加趋势
            current += trend * (Math.random() - 0.5);
            // 添加波动
            current += volatility * (Math.random() - 0.5);
            // 保持在合理范围内
            current = Math.max(20, Math.min(80, current));
            values.push(Math.round(current * 10) / 10);
        }
        
        return values;
    }
    
    return {
        health: {
            time: times,
            value: generateCurveData(50, 0.1, 4)
        },
        career: {
            time: times,
            value: generateCurveData(45, 0.15, 5)
        },
        love: {
            time: times,
            value: generateCurveData(55, 0.05, 3)
        }
    };
}

// 调用后端API进行生日分析，失败时使用模拟数据
async function analyzeBirthdayAPI(userData) {
    // API端点列表，按优先级排序
    const apiEndpoints = [
//        'https://3.141.200.229:9999/analyze/birthday', // HTTPS优先
        'http://3.141.200.229:9999/analyze/birthday'   // HTTP备用
    ];
    
    // 设置较短的超时时间，避免用户等待太久
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), 3000); // 3秒超时
    });
    
    for (const endpoint of apiEndpoints) {
        try {
            console.log(`尝试连接API: ${endpoint}`);
            
            const fetchPromise = fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            // 使用Promise.race来实现超时控制
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            console.log('收到响应:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`使用真实API数据 (${endpoint})`);
            return data;
        } catch (error) {
            console.warn(`API端点 ${endpoint} 不可用:`, error.message);
            // 继续尝试下一个端点
        }
    }
    
    // 所有API端点都失败，使用模拟数据
    console.log('🎲 所有API端点都不可用，使用模拟数据');
    return generateMockData();
}

// 模拟生日分析数据生成
// function generateBirthdayAnalysis(birthday) {
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             // 生成三条曲线的随机数据
//             const generateData = () => ['6月', '7月', '8月', '9月'].map(() => 
//                 Math.floor(Math.random() * 60) + 20
//             );

//             resolve({
//                 health: generateData(),    // 健康
//                 career: generateData(),    // 事业
//                 love: generateData()       // 爱情
//             });
//         }, 500);
//     });

// 辅助函数：找出每个月的全局最大值和最小值的索引
function findMonthlyExtrema(times, values) {
    const maxima = [];
    const minima = [];
    let month = null;
    let monthIndices = [];
    for (let i = 0; i < times.length; i++) {
        const curMonth = times[i].slice(0, 2); // "MM" 部分
        if (month === null) {
            month = curMonth;
        }
        if (curMonth !== month) {
            // 处理上一个月
            if (monthIndices.length > 0) {
                let maxIdx = monthIndices[0];
                let minIdx = monthIndices[0];
                for (const idx of monthIndices) {
                    if (values[idx] > values[maxIdx]) maxIdx = idx;
                    if (values[idx] < values[minIdx]) minIdx = idx;
                }
                maxima.push(maxIdx);
                minima.push(minIdx);
            }
            // 开始新月份
            month = curMonth;
            monthIndices = [];
        }
        monthIndices.push(i);
    }
    // 处理最后一个月
    if (monthIndices.length > 0) {
        let maxIdx = monthIndices[0];
        let minIdx = monthIndices[0];
        for (const idx of monthIndices) {
            if (values[idx] > values[maxIdx]) maxIdx = idx;
            if (values[idx] < values[minIdx]) minIdx = idx;
        }
        maxima.push(maxIdx);
        minima.push(minIdx);
    }
    return { maxima, minima };
}

// 数据聚合函数
function aggregateDataByLevel(rawData, level) {
    const { health, career, love } = rawData;
    
    switch (level) {
        case 'month':
            return aggregateByMonth(health, career, love);
        case 'day':
        default:
            return aggregateByDay(health, career, love);
    }
}

// function aggregateByMonth(health, career, love) {
//     const monthlyData = {};
    
//     health.time.forEach((time, index) => {
//         const month = time.slice(0, 2);
//         if (!monthlyData[month]) {
//             monthlyData[month] = {
//                 health: [],
//                 career: [],
//                 love: []
//             };
//         }
//         monthlyData[month].health.push(health.value[index]);
//         monthlyData[month].career.push(career.value[index]);
//         monthlyData[month].love.push(love.value[index]);
//     });
    
//     const result = {
//         health: { time: [], value: [] },
//         career: { time: [], value: [] },
//         love: { time: [], value: [] }
//     };
    
//     Object.keys(monthlyData).forEach(month => {
//         const monthNum = month.replace(/^0/, '');
//         result.health.time.push(monthNum + '月');
//         result.career.time.push(monthNum + '月');
//         result.love.time.push(monthNum + '月');
        
//         // 计算每月平均值
//         result.health.value.push(Math.round(monthlyData[month].health.reduce((a, b) => a + b) / monthlyData[month].health.length * 10) / 10);
//         result.career.value.push(Math.round(monthlyData[month].career.reduce((a, b) => a + b) / monthlyData[month].career.length * 10) / 10);
//         result.love.value.push(Math.round(monthlyData[month].love.reduce((a, b) => a + b) / monthlyData[month].love.length * 10) / 10);
//     });
    
//     return result;
// }

function aggregateByMonth(health, career, love) {
    // 按天聚合，每12个时间点为一组
    const result = {
        health: { time: [], value: [] },
        career: { time: [], value: [] },
        love: { time: [], value: [] }
    };
    
    for (let i = 0; i < Math.round(health.time.length); i += 120) {
        const dayData = {
            health: health.value.slice(i, i + 120),
            career: career.value.slice(i, i + 120),
            love: love.value.slice(i, i + 120)
        };
        
        const dayLabel = health.time[i].slice(0, 5); // "MM-DD"
        
        result.health.time.push(dayLabel);
        result.career.time.push(dayLabel);
        result.love.time.push(dayLabel);
        
        result.health.value.push(Math.round(dayData.health.reduce((a, b) => a + b) / dayData.health.length * 120) / 120);
        result.career.value.push(Math.round(dayData.career.reduce((a, b) => a + b) / dayData.career.length * 120) / 120);
        result.love.value.push(Math.round(dayData.love.reduce((a, b) => a + b) / dayData.love.length * 120) / 120);
    }
    
    return result;
}


function aggregateByDay(health, career, love) {
    // 按天聚合，每12个时间点为一组
    const result = {
        health: { time: [], value: [] },
        career: { time: [], value: [] },
        love: { time: [], value: [] }
    };
    
    for (let i = 0; i < Math.round(health.time.length/3); i += 12) {
        const dayData = {
            health: health.value.slice(i, i + 12),
            career: career.value.slice(i, i + 12),
            love: love.value.slice(i, i + 12)
        };
        
        const dayLabel = health.time[i].slice(0, 5); // "MM-DD"
        
        result.health.time.push(dayLabel);
        result.career.time.push(dayLabel);
        result.love.time.push(dayLabel);
        
        result.health.value.push(Math.round(dayData.health.reduce((a, b) => a + b) / dayData.health.length * 10) / 10);
        result.career.value.push(Math.round(dayData.career.reduce((a, b) => a + b) / dayData.career.length * 10) / 10);
        result.love.value.push(Math.round(dayData.love.reduce((a, b) => a + b) / dayData.love.length * 10) / 10);
    }
    
    return result;
}

// 滑动窗口平均函数
function slidingWindowAverage(data, zoomLevel, offset = 0) {
    if (data.length <= 12) {
        return data; // 如果数据点不超过12个，直接返回
    }
    
    // 根据缩放级别计算窗口大小
    // 级别1: 3个月视图(90天), 1080个点 -> 每90个点一组
    // 级别2: 1个月视图(30天), 360个点 -> 每30个点一组  
    // 级别3: 10天视图, 120个点 -> 每10个点一组
    // 级别4: 3天视图, 36个点 -> 每3个点一组
    // 级别5+: 越来越细节
    
    let pointsPerGroup;
    switch(zoomLevel) {
        case 1: pointsPerGroup = 90; break;  // 3个月视图
        case 2: pointsPerGroup = 30; break;  // 1个月视图
        case 3: pointsPerGroup = 10; break;  // 10天视图
        case 4: pointsPerGroup = 3; break;   // 3天视图
        case 5: pointsPerGroup = 2; break;   // 2天视图
        default: pointsPerGroup = 1; break;  // 最细节视图
    }
    
    // 如果数据点数少于窗口大小，直接返回
    if (data.length <= pointsPerGroup * 12) {
        // 计算实际需要的窗口大小
        pointsPerGroup = Math.max(1, Math.floor(data.length / 12));
    }
    
    const result = [];
    
    for (let i = 0; i < 12; i++) {
        const startIdx = offset + i * pointsPerGroup;
        const endIdx = Math.min(startIdx + pointsPerGroup, data.length);
        
        if (startIdx >= data.length) break;
        
        // 计算窗口内的平均值
        let sum = 0;
        let count = 0;
        for (let j = startIdx; j < endIdx; j++) {
            if (typeof data[j] === 'number' && !isNaN(data[j])) {
                sum += data[j];
                count++;
            }
        }
        
        result.push(count > 0 ? sum / count : 0);
    }
    
    return result;
}

// 处理时间标签的滑动窗口
function slidingWindowLabels(labels, values, zoomLevel, offset = 0) {
    if (labels.length <= 12) {
        return labels;
    }
    
    // 使用与数据相同的窗口逻辑
    let pointsPerGroup;
    switch(zoomLevel) {
        case 1: pointsPerGroup = 90; break;  // 3个月视图
        case 2: pointsPerGroup = 30; break;  // 1个月视图
        case 3: pointsPerGroup = 10; break;  // 10天视图
        case 4: pointsPerGroup = 3; break;   // 3天视图
        case 5: pointsPerGroup = 2; break;   // 2天视图
        default: pointsPerGroup = 1; break;  // 最细节视图
    }
    
    if (labels.length <= pointsPerGroup * 12) {
        pointsPerGroup = Math.max(1, Math.floor(labels.length / 12));
    }
    
    const result = [];
    
    for (let i = 0; i < 12; i++) {
        const startIdx = offset + i * pointsPerGroup;
        const endIdx = Math.min(startIdx + pointsPerGroup, labels.length);
        
        if (startIdx >= labels.length) break;
        
        // 使用窗口中间的标签
        const middleIdx = Math.floor((startIdx + endIdx) / 2);
        result.push(labels[middleIdx] || labels[startIdx] || `点${i + 1}`);
    }
    
    return result;
}

// 主应用逻辑
class BirthdayAnalyzer {
    constructor() {
        this.chart = null;
        this.rawData = null;
        this.currentZoomLevel = 1;
        this.maxZoomLevel = 6;
        this.currentOffset = 0;
        
        // 设置出生时间输入的最大值为当前时间
        const birthtimeInput = document.getElementById('birthtime');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        birthtimeInput.max = `${year}-${month}-${day}T${hours}:${minutes}`;
        birthtimeInput.min = "1900-01-01T00:00";
        
        // 设置全局变量以便onClick事件访问
        window.birthdayAnalyzer = this;
        
        // 自动填充用户数据
        this.autoFillUserData();
        
        this.initializeEventListeners();
        this.initializeChart();
    }

    // 自动填充用户数据
    autoFillUserData() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                
                // 填充姓名
                if (user.name) {
                    document.getElementById('name').value = user.name;
                } else if (user.displayName) {
                    document.getElementById('name').value = user.displayName;
                } else if (user.username) {
                    document.getElementById('name').value = user.username;
                }
                
                // 填充性别
                if (user.gender) {
                    document.getElementById('gender').value = user.gender;
                }
                
                // 填充出生时间
                let datetimeValue = '';
                if (user.birthDate && user.birthTime) {
                    datetimeValue = `${user.birthDate}T${user.birthTime}`;
                } else if (user.birthDatetime) {
                    const parts = user.birthDatetime.split(' ');
                    if (parts.length >= 2) {
                        datetimeValue = `${parts[0]}T${parts[1]}`;
                    } else if (parts[0].includes('-')) {
                        datetimeValue = parts[0] + 'T00:00';
                    }
                }
                if (datetimeValue) {
                    document.getElementById('birthtime').value = datetimeValue;
                }
                
                // 填充出生地点
                if (user.birthLocation) {
                    document.getElementById('birthplace').value = user.birthLocation;
                }
            }
        } catch (error) {
            console.error('Error auto-filling user data:', error);
        }
    }

    validateDateTime(dateTimeStr) {
        // 尝试解析日期时间
        const date = new Date(dateTimeStr);

        // 1. 检查是否能成功解析
        if (isNaN(date.getTime())) {
            return { valid: false, message: '请输入有效的日期和时间' };
        }

        // 2. 检查年份范围
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) {
            return { valid: false, message: `年份必须在1900到${currentYear}年之间` };
        }

        // 3. 检查是否是未来时间
        const now = new Date();
        if (date > now) {
            return { valid: false, message: '不能选择未来时间' };
        }

        // 4. 检查日期是否真的存在（例如避免2月30号）
        const month = date.getMonth(); // 0-11
        const day = date.getDate();
        const realMaxDay = new Date(year, month + 1, 0).getDate();
        if (day > realMaxDay) {
            return { valid: false, message: '该日期不存在' };
        }

        return { valid: true };
    }

    initializeEventListeners() {
        // 添加日期时间输入验证
        const birthtimeInput = document.getElementById('birthtime');
        birthtimeInput.addEventListener('change', () => {
            const dateTimeValue = birthtimeInput.value;
            if (dateTimeValue) {
                const validation = this.validateDateTime(dateTimeValue);
                if (!validation.valid) {
                    alert(validation.message);
                    birthtimeInput.value = '';
                    return;
                }
            }
        });

        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => this.analyzeBirthday());
        
        // 添加缩放控制按钮事件
        this.addZoomControls();
    }
    
    // 测试模拟数据功能
    async testMockData() {
        console.log('🧪 测试模拟数据功能...');
        try {
            this.rawData = generateMockData();
            this.updateChart();
            console.log('模拟数据测试成功');
        } catch (error) {
            console.error('模拟数据测试失败:', error);
        }
    }
    
    addZoomControls() {
        const energySection = document.querySelector('.energy-section');
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'zoom-controls';
        controlsDiv.style.cssText = `
            margin-bottom: 20px; 
            display: flex; 
            flex-direction: column;
            gap: 10px; 
            align-items: center; 
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // 创建信息显示行
        const infoRow = document.createElement('div');
        infoRow.className = 'zoom-info-row';
        infoRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
        `;

        // 缩放级别显示
        const zoomInfo = document.createElement('div');
        zoomInfo.className = 'zoom-info';
        zoomInfo.style.cssText = `
            padding: 6px 12px;
            background: rgba(255,255,255,0.05);
            color: #E2E8F0;
            border-radius: 6px;
            font-size: 12px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
            white-space: nowrap;
            min-width: 150px;
        `;

        // 创建按钮行
        const buttonRow = document.createElement('div');
        buttonRow.className = 'zoom-button-row';
        buttonRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            width: 100%;
        `;
        
        // Zoom Out 按钮
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.innerHTML = '⊖';
        zoomOutBtn.className = 'zoom-out-btn';
        zoomOutBtn.style.cssText = `
            padding: 8px;
            background: transparent;
            color: white;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 18px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Zoom In 按钮
        const zoomInBtn = document.createElement('button');
        zoomInBtn.innerHTML = '⊕';
        zoomInBtn.className = 'zoom-in-btn';
        zoomInBtn.style.cssText = zoomOutBtn.style.cssText;
        
        // 滑动按钮
        const slideLeftBtn = document.createElement('button');
        slideLeftBtn.innerHTML = '◀';
        slideLeftBtn.className = 'slide-left-btn';
        slideLeftBtn.style.cssText = `
            padding: 8px;
            background: transparent;
            color: white;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 16px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const slideRightBtn = document.createElement('button');
        slideRightBtn.innerHTML = '▶';
        slideRightBtn.className = 'slide-right-btn';
        slideRightBtn.style.cssText = slideLeftBtn.style.cssText;

        // 添加事件监听器
        zoomOutBtn.addEventListener('click', () => {
            if (this.currentZoomLevel > 1) {
                this.adjustOffsetForZoomChange(this.currentZoomLevel, this.currentZoomLevel - 1);
                this.currentZoomLevel--;
                this.updateZoomInfo();
                this.updateChart();
            }
        });
        
        zoomInBtn.addEventListener('click', () => {
            if (this.currentZoomLevel < this.maxZoomLevel) {
                this.adjustOffsetForZoomChange(this.currentZoomLevel, this.currentZoomLevel + 1);
                this.currentZoomLevel++;
                this.updateZoomInfo();
                this.updateChart();
            }
        });

        slideLeftBtn.addEventListener('click', () => this.slideLeft());
        slideRightBtn.addEventListener('click', () => this.slideRight());

        // 添加悬停效果
        [zoomOutBtn, zoomInBtn, slideLeftBtn, slideRightBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.opacity = '0.8';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.opacity = '1';
            });
        });

        // 组装布局
        infoRow.appendChild(zoomInfo);
        buttonRow.appendChild(zoomOutBtn);
        buttonRow.appendChild(zoomInBtn);
        buttonRow.appendChild(slideLeftBtn);
        buttonRow.appendChild(slideRightBtn);

        controlsDiv.appendChild(infoRow);
        controlsDiv.appendChild(buttonRow);
        
        // 添加响应式样式
        const style = document.createElement('style');
        style.textContent = `
            @media (min-width: 769px) {
                .zoom-controls {
                    flex-direction: row !important;
                    gap: 15px !important;
                    justify-content: center !important;
                }
                .zoom-info-row {
                    width: auto !important;
                    flex: 0 0 auto !important;
                }
                .zoom-button-row {
                    width: auto !important;
                    flex: 0 0 auto !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        energySection.insertBefore(controlsDiv, energySection.querySelector('canvas'));
        this.updateZoomInfo();
    }
    
    adjustOffsetForZoomChange(fromLevel, toLevel) {
        if (fromLevel === 1) {
            // 从3个月视图切换到其他级别，偏移量保持0
            this.currentOffset = 0;
            return;
        }
        
        if (toLevel === 1) {
            // 切换到3个月视图，偏移量重置为0
            this.currentOffset = 0;
            return;
        }
        
        // 计算当前显示的时间点在数据中的位置
        const fromPointsPerGroup = this.getPointsPerGroup(fromLevel);
        const toPointsPerGroup = this.getPointsPerGroup(toLevel);
        
        // 计算当前视图中心点的数据索引
        const currentCenterIndex = this.currentOffset + (fromPointsPerGroup * 12) / 2;
        
        // 计算新级别下应该的偏移量，让中心点保持相同
        const newOffset = Math.max(0, currentCenterIndex - (toPointsPerGroup * 12) / 2);
        
        // 确保偏移量不超过最大值
        const maxOffset = this.getMaxOffsetForLevel(toLevel);
        this.currentOffset = Math.min(newOffset, maxOffset);
    }
    
    getPointsPerGroup(zoomLevel) {
        switch(zoomLevel) {
            case 1: return 90;  // 3个月视图
            case 2: return 30;  // 1个月视图
            case 3: return 10;  // 10天视图
            case 4: return 3;   // 3天视图
            case 5: return 2;   // 2天视图
            default: return 1;  // 最细节视图
        }
    }
    
    getMaxOffsetForLevel(zoomLevel) {
        if (!this.rawData) return 0;
        
        const dataLength = this.rawData.health.value.length;
        const pointsPerGroup = this.getPointsPerGroup(zoomLevel);
        
        return Math.max(0, dataLength - pointsPerGroup * 12);
    }

    slideLeft() {
        if (this.currentZoomLevel === 1) return; // 3个月视图不需要滑动
        
        const slideStep = this.getSlideStep();
        this.currentOffset = Math.max(0, this.currentOffset - slideStep);
        this.updateChart();
        this.updateSlideButtons();
    }
    
    slideRight() {
        if (this.currentZoomLevel === 1) return; // 3个月视图不需要滑动
        
        const slideStep = this.getSlideStep();
        const maxOffset = this.getMaxOffset();
        this.currentOffset = Math.min(maxOffset, this.currentOffset + slideStep);
        this.updateChart();
        this.updateSlideButtons();
    }
    
    getSlideStep() {
        // 根据缩放级别计算滑动步长
        const pointsPerGroup = this.getPointsPerGroup(this.currentZoomLevel);
        return pointsPerGroup * 12; // 滑动一个完整视图的宽度
    }
    
    getMaxOffset() {
        return this.getMaxOffsetForLevel(this.currentZoomLevel);
    }
    
    updateSlideButtons() {
        const slideLeftBtn = document.querySelector('.slide-left-btn');
        const slideRightBtn = document.querySelector('.slide-right-btn');
        const maxOffset = this.getMaxOffset();
        
        if (slideLeftBtn) {
            const canSlideLeft = this.currentOffset > 0 && this.currentZoomLevel > 1;
            slideLeftBtn.disabled = !canSlideLeft;
            slideLeftBtn.style.opacity = slideLeftBtn.disabled ? '0.3' : '1';
            slideLeftBtn.style.cursor = slideLeftBtn.disabled ? 'not-allowed' : 'pointer';
            slideLeftBtn.style.display = this.currentZoomLevel === 1 ? 'none' : 'flex';
        }
        
        if (slideRightBtn) {
            const canSlideRight = this.currentOffset < maxOffset && this.currentZoomLevel > 1;
            slideRightBtn.disabled = !canSlideRight;
            slideRightBtn.style.opacity = slideRightBtn.disabled ? '0.3' : '1';
            slideRightBtn.style.cursor = slideRightBtn.disabled ? 'not-allowed' : 'pointer';
            slideRightBtn.style.display = this.currentZoomLevel === 1 ? 'none' : 'flex';
        }
    }

    updateZoomInfo() {
        const zoomInfo = document.querySelector('.zoom-info');
        if (!zoomInfo) return;

        const windowSize = this.currentZoomLevel;
        const timespan = this.getTimespanDescription(windowSize, 12);
        
        zoomInfo.textContent = `级别${this.currentZoomLevel} ${timespan}`;
        
        // 更新按钮状态
        const zoomOutBtn = document.querySelector('.zoom-out-btn');
        const zoomInBtn = document.querySelector('.zoom-in-btn');
        
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.currentZoomLevel <= 1;
            zoomOutBtn.style.opacity = zoomOutBtn.disabled ? '0.5' : '1';
            zoomOutBtn.style.cursor = zoomOutBtn.disabled ? 'not-allowed' : 'pointer';
        }
        
        if (zoomInBtn) {
            zoomInBtn.disabled = this.currentZoomLevel >= this.maxZoomLevel;
            zoomInBtn.style.opacity = zoomInBtn.disabled ? '0.5' : '1';
            zoomInBtn.style.cursor = zoomInBtn.disabled ? 'not-allowed' : 'pointer';
        }
    }
    
    getTimespanDescription(zoomLevel, dataPoints) {
        // 根据缩放级别计算每个显示点代表的时间跨度
        let pointsPerGroup;
        let viewDescription;
        
        switch(zoomLevel) {
            case 1: 
                pointsPerGroup = 90;
                viewDescription = "3个月视图 (7.5天/点)";
                break;
            case 2: 
                pointsPerGroup = 30;
                viewDescription = "1个月视图 (2.5天/点)";
                break;
            case 3: 
                pointsPerGroup = 10;
                viewDescription = "10天视图 (20小时/点)";
                break;
            case 4: 
                pointsPerGroup = 3;
                viewDescription = "3天视图 (6小时/点)";
                break;
            case 5: 
                pointsPerGroup = 2;
                viewDescription = "2天视图 (4小时/点)";
                break;
            default: 
                pointsPerGroup = 1;
                viewDescription = "最细节视图 (2小时/点)";
                break;
        }
        
        return viewDescription;
    }

    initializeChart() {
        const ctx = document.getElementById('energyChart').getContext('2d');
        
        // 创建渐变色
        const healthGradient = ctx.createLinearGradient(0, 0, 0, 400);
        healthGradient.addColorStop(0, 'rgba(81, 22, 180, 0.3)');
        healthGradient.addColorStop(1, 'rgba(81, 22, 180, 0.05)');
        
        const careerGradient = ctx.createLinearGradient(0, 0, 0, 400);
        careerGradient.addColorStop(0, 'rgba(39, 89, 172, 0.3)');
        careerGradient.addColorStop(1, 'rgba(39, 89, 172, 0.05)');
        
        const loveGradient = ctx.createLinearGradient(0, 0, 0, 400);
        loveGradient.addColorStop(0, 'rgba(148, 68, 163, 0.3)');
        loveGradient.addColorStop(1, 'rgba(148, 68, 163, 0.05)');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '健康',
                        data: [],
                        borderColor: '#5116b4',
                        backgroundColor: healthGradient,
                        tension: 0.8,
                        fill: true,
                        borderWidth: 5
                    },
                    {
                        label: '事业',
                        data: [],
                        borderColor: '#2759ac',
                        backgroundColor: careerGradient,
                        tension: 0.8,
                        fill: true,
                        borderWidth: 5
                    },
                    {
                        label: '爱情',
                        data: [],
                        borderColor: '#9444a3',
                        backgroundColor: loveGradient,
                        tension: 0.8,
                        fill: true,
                        borderWidth: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest',
                    axis: 'xy'
                },
                onHover: (event, elements) => {
                    // 移除之前的tooltip
                    const existingTooltip = document.getElementById('custom-tooltip');
                    if (existingTooltip) {
                        existingTooltip.remove();
                    }
                    
                    if (elements.length > 0) {
                        const element = elements[0];
                        const datasetIndex = element.datasetIndex;
                        const dataIndex = element.index;
                        
                        // 检查悬停的是否是白色圆点（最高点）
                        const dataset = window.birthdayAnalyzer.chart.data.datasets[datasetIndex];
                        const pointRadius = dataset.pointRadius;
                        const isMaxPoint = Array.isArray(pointRadius) ? pointRadius[dataIndex] > 0 : pointRadius > 0;
                        
                        if (isMaxPoint) {
                            window.birthdayAnalyzer.showTooltipAtPoint(event, datasetIndex, dataIndex);
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false,  // 禁用默认的悬停tooltip
                        external: function(context) {
                            // 自定义tooltip显示逻辑
                            return;
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#E2E8F0',
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 14
                            },
                            maxTicksLimit: 12 // 始终最多显示12个刻度
                        }
                    },
                    y: {
                        min: 55,
                        max: 105,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#E2E8F0',
                            font: {
                                size: 14
                            }
                        },
                        display: false
                    }
                }
            }
        });
    }

    async analyzeBirthday() {
        const nameInput = document.getElementById('name');
        const birthtimeInput = document.getElementById('birthtime');
        const birthplaceInput = document.getElementById('birthplace');
        const submitBtn = document.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        
        const name = nameInput.value.trim();
        const birthtime = birthtimeInput.value;
        const birthplace = birthplaceInput.value.trim();

        // 验证必填字段
        if (!name) {
            alert('请输入姓名');
            nameInput.focus();
            return;
        }

        if (!birthtime) {
            alert('请选择出生时间');
            birthtimeInput.focus();
            return;
        }

        // 验证日期和时间
        const validation = this.validateDateTime(birthtime);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        if (!birthplace) {
            alert('请输入出生地');
            birthplaceInput.focus();
            return;
        }

        try {
            // 显示加载状态
            submitBtn.disabled = true;
            btnText.textContent = '推演中...';
            console.log('🚀 开始分析生日数据...');

            // 从datetime-local格式中提取日期和时间
            const datetimeObj = new Date(birthtime);
            const birthday = datetimeObj.toISOString().split('T')[0]; // YYYY-MM-DD格式
            const timeOnly = datetimeObj.toTimeString().split(' ')[0].substring(0, 5); // HH:MM格式
            
            const userData = {
                name: name,
                email: `${name}@example.com`, // 自动生成邮箱
                phone: "000-0000-0000",
                birthday: birthday,
                birthtime: timeOnly,
                birthplace: birthplace
            };

            this.rawData = await analyzeBirthdayAPI(userData);
            this.updateChart();

            console.log('分析完成，图表已更新');
        } catch (error) {
            console.error('分析失败:', error);
            alert('分析失败，请稍后重试');
        } finally {
            // 恢复按钮状态
            submitBtn.disabled = false;
            btnText.textContent = '推演';
        }
    }
    
    updateChart() {
        if (!this.rawData) return;
        
        // 应用滑动窗口平均到数据
        const healthValues = slidingWindowAverage(this.rawData.health.value, this.currentZoomLevel, this.currentOffset);
        const careerValues = slidingWindowAverage(this.rawData.career.value, this.currentZoomLevel, this.currentOffset);
        const loveValues = slidingWindowAverage(this.rawData.love.value, this.currentZoomLevel, this.currentOffset);
        
        // 应用滑动窗口到时间标签
        const timeLabels = slidingWindowLabels(this.rawData.health.time, this.rawData.health.value, this.currentZoomLevel, this.currentOffset);
        
        // 构造处理后的数据对象
        const processedData = {
            health: { value: healthValues, time: timeLabels },
            career: { value: careerValues, time: timeLabels },
            love: { value: loveValues, time: timeLabels }
        };
        
        // 更新图表数据
        this.chart.data.labels = processedData.health.time;
        this.chart.data.datasets[0].data = processedData.health.value;
        this.chart.data.datasets[1].data = processedData.career.value;
        this.chart.data.datasets[2].data = processedData.love.value;

        // 根据处理后的数据设置高亮点
        this.setHighlightPoints(processedData);
        
        // 更新缩放信息显示
        this.updateZoomInfo();
        
        this.chart.update();
    }
    
    setHighlightPoints(data) {
        // 找出每条曲线的最高点
        function findMaximumPoints(values) {
            const maxValue = Math.max(...values);
            const maxIndices = [];
            values.forEach((value, index) => {
                if (value === maxValue) {
                    maxIndices.push(index);
                }
            });
            return maxIndices;
        }
        
        // 为每条曲线找出最高点
        const healthMaxima = findMaximumPoints(data.health.value);
        const careerMaxima = findMaximumPoints(data.career.value);
        const loveMaxima = findMaximumPoints(data.love.value);
        
        // 创建点半径数组，只在最高点显示白色圆点
        function makePointRadius(length, maxima) {
            const arr = new Array(length).fill(0);
            maxima.forEach(i => arr[i] = 8);
            return arr;
        }
        
        // 创建点颜色数组，最高点为白色，其他透明
        function makePointColor(length, maxima) {
            const arr = new Array(length).fill('rgba(0,0,0,0)');
            maxima.forEach(i => arr[i] = '#FFFFFF');
            return arr;
        }
        
        // 创建点击检测半径数组，让白色圆点更容易被检测到
        function makePointHitRadius(length, maxima) {
            const arr = new Array(length).fill(1);
            maxima.forEach(i => arr[i] = 15); // 增大检测半径
            return arr;
        }
        
        // 统一显示能量最高点的白色圆点（不再区分月视图和日视图）
        this.chart.data.datasets[0].pointRadius = makePointRadius(data.health.value.length, healthMaxima);
        this.chart.data.datasets[1].pointRadius = makePointRadius(data.career.value.length, careerMaxima);
        this.chart.data.datasets[2].pointRadius = makePointRadius(data.love.value.length, loveMaxima);
        
        this.chart.data.datasets[0].pointBackgroundColor = makePointColor(data.health.value.length, healthMaxima);
        this.chart.data.datasets[1].pointBackgroundColor = makePointColor(data.career.value.length, careerMaxima);
        this.chart.data.datasets[2].pointBackgroundColor = makePointColor(data.love.value.length, loveMaxima);
        
        // 设置点的边框颜色，使白色圆点更明显
        this.chart.data.datasets[0].pointBorderColor = makePointColor(data.health.value.length, healthMaxima).map(c => c === '#FFFFFF' ? '#5116b4' : 'rgba(0,0,0,0)');
        this.chart.data.datasets[1].pointBorderColor = makePointColor(data.career.value.length, careerMaxima).map(c => c === '#FFFFFF' ? '#2759ac' : 'rgba(0,0,0,0)');
        this.chart.data.datasets[2].pointBorderColor = makePointColor(data.love.value.length, loveMaxima).map(c => c === '#FFFFFF' ? '#9444a3' : 'rgba(0,0,0,0)');
        
        // 设置点的边框宽度
        this.chart.data.datasets[0].pointBorderWidth = makePointRadius(data.health.value.length, healthMaxima).map(r => r > 0 ? 2 : 0);
        this.chart.data.datasets[1].pointBorderWidth = makePointRadius(data.career.value.length, careerMaxima).map(r => r > 0 ? 2 : 0);
        this.chart.data.datasets[2].pointBorderWidth = makePointRadius(data.love.value.length, loveMaxima).map(r => r > 0 ? 2 : 0);
        
        // 设置点击检测半径，让白色圆点更容易被检测到
        this.chart.data.datasets[0].pointHitRadius = makePointHitRadius(data.health.value.length, healthMaxima);
        this.chart.data.datasets[1].pointHitRadius = makePointHitRadius(data.career.value.length, careerMaxima);
        this.chart.data.datasets[2].pointHitRadius = makePointHitRadius(data.love.value.length, loveMaxima);
    }
    
    showTooltipAtPoint(event, datasetIndex, dataIndex) {
        const dataset = this.chart.data.datasets[datasetIndex];
        const label = this.chart.data.labels[dataIndex];
        const value = dataset.data[dataIndex];
        const curveName = dataset.label;
        
        // 移除之前的tooltip
        const existingTooltip = document.getElementById('custom-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // 获取图表容器的位置
        const chartContainer = this.chart.canvas.getBoundingClientRect();
        const canvasPosition = Chart.helpers.getRelativePosition(event, this.chart);
        const datasetMeta = this.chart.getDatasetMeta(datasetIndex);
        const pointElement = datasetMeta.data[dataIndex];
        
        // 创建自定义tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'custom-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            white-space: nowrap;
        `;
        
        // 设置曲线颜色
        const colors = {
            '健康': '#5116b4',
            '事业': '#2759ac', 
            '爱情': '#9444a3'
        };
        
        tooltip.innerHTML = `
            <div style="margin-bottom: 6px; font-weight: bold; color: #E2E8F0;">
                时间: ${label}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[curveName]};"></div>
                <span style="font-weight: bold;">${curveName}</span>
            </div>
            <div style="margin-top: 4px; font-size: 12px; color: #A0AEC0;">
                ⭐ 能量最高点
            </div>
        `;
        
        // 将tooltip添加到图表容器
        const chartWrapper = this.chart.canvas.parentElement;
        chartWrapper.style.position = 'relative';
        chartWrapper.appendChild(tooltip);
        
        // 计算tooltip位置
        const tooltipRect = tooltip.getBoundingClientRect();
        const pointX = pointElement.x;
        const pointY = pointElement.y;
        
        // 调整位置，确保tooltip不会超出图表边界
        let left = pointX - tooltipRect.width / 2;
        let top = pointY - tooltipRect.height - 10;
        
        // 边界检查
        if (left < 0) left = 10;
        if (left + tooltipRect.width > chartContainer.width) {
            left = chartContainer.width - tooltipRect.width - 10;
        }
        if (top < 0) {
            top = pointY + 10; // 显示在点的下方
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        // 鼠标移开图表区域时自动隐藏tooltip
        const chartCanvas = this.chart.canvas;
        const hideTooltipOnLeave = () => {
            if (tooltip && tooltip.parentElement) {
                tooltip.remove();
            }
            chartCanvas.removeEventListener('mouseleave', hideTooltipOnLeave);
        };
        
        chartCanvas.addEventListener('mouseleave', hideTooltipOnLeave);
    }
}

// 页面加载时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BirthdayAnalyzer();
}); 
