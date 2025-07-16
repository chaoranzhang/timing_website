// Authentication System for SparkingTiming - Complete User Authentication Solution
class AuthSystem {
    constructor() {
        // 检测是否在本地测试环境
        this.isLocalTest = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.protocol === 'file:';
        
        if (this.isLocalTest) {
            this.API_BASE_URL = 'http://127.0.0.1:9999';
            this.API_VERSION = '';
        } else {
            this.API_BASE_URL = 'https://curve.sparkingtiming.com:9443';
            this.API_VERSION = '';
        }
        
        this.TIMEOUT = 10000;
        this.currentLanguage = 'zh';
        this.verificationCodeSent = false;
        this.verificationCodeValid = null; // null: unknown, true: valid, false: invalid
        this.verificationCodeTimer = null;
        this.verificationCodeCountdown = 0;
        this.init();
    }
    
    init() {
        this.detectLanguage();
        this.bindEventListeners();
        this.checkLoginStatus();
    }
    
    detectLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        
        if (langParam === 'en') {
            this.currentLanguage = 'en';
        } else if (langParam === 'zh') {
            this.currentLanguage = 'zh';
        }
    }
    
    bindEventListeners() {
        if (document.getElementById('registerForm')) {
            this.bindRegisterEvents();
        }

        if (document.getElementById('loginForm')) {
            this.bindLoginEvents();
        }

        if (document.getElementById('verificationForm')){
            this.bindVerificationEvents();
        }

        if (document.getElementById('userInfoForm')){
            this.bindInfoEvents();
        }
    }

    bindInfoEvents(){
        const userInfoForm = document.getElementById('userInfoForm');
        if (userInfoForm) {
            userInfoForm.addEventListener('submit', (e) => this.handleuserInfo(e));
        }
    }
    

    bindVerificationEvents(){
        const sendVerificationBtn = document.querySelector('.verification-resend');
        if (sendVerificationBtn) {
            sendVerificationBtn.addEventListener('click', () => this.sendVerificationCode());
        }

        const verificationForm = document.getElementById('verificationForm');
        if (verificationForm) {
            verificationForm.addEventListener('submit', (e) => this.handleVerification(e));
        }
    }
    
    bindRegisterEvents() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            document.getElementById('register-submit').addEventListener('click', (e) => this.handleRegister(e));
            document.getElementById('verification-submit').addEventListener('click', (e) => this.handleVerification(e));
        }

        const sendVerificationBtn = document.querySelector('.verification-resend');
        if (sendVerificationBtn) {
            sendVerificationBtn.addEventListener('click', () => this.sendVerificationCode());
        }
    }
    
    bindLoginEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    /**
     * Generic API request method
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - API response
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${this.API_VERSION}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.TIMEOUT
        };

        console.log("options: ", options);

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            console.log(`Making ${mergedOptions.method} request to: ${url}`);
            console.log('options: ', mergedOptions);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

            const response = await fetch(url, {
                ...mergedOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('API Response:', data);
            return data;

        } catch (error) {
            console.error('API Request failed:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络连接');
            }
            
            throw error;
        }
    }

    async getUserInformation() {
        try{ 
            const username_token = localStorage.getItem('username_token');

            const response = await this.makeRequest('/users/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${username_token}`
                },
            });

            localStorage.setItem('user_id', response.user_id);
            localStorage.setItem('username', response.username);
            localStorage.setItem('email', response.email);
            localStorage.setItem('gender', response.sex);

            localStorage.setItem('first_name', response.first_name);
            localStorage.setItem('last_name', response.last_name);
            localStorage.setItem('birthplace', response.birthplace);
            
            const dob = response.dob;
            const tIndex = dob.indexOf("T");
            const birthdate = dob.substring(0, tIndex);
            const birthtime = dob.substring(tIndex+1);

            localStorage.setItem('birthdate', birthdate);
            localStorage.setItem('birthtime', birthtime);
        } catch (error) {
            this.showMessage(this.handleAPIError(error), 'error');
            console.error('User information retrieve error:', error);
        }
    }
    
    async sendVerificationCode() {
        const usernameInput = document.getElementById('username');
        const username = usernameInput?.value?.trim();
        
        if (!username) {
            this.showMessage(this.getMessage('pleaseEnterUsername'), 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const requestData = {username: username};

            console.log("request Data: ", requestData);
            const response = await this.makeRequest('/auth/resend-verification-code', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            console.log("response: ", response);
            
            // Update button text to "Resend" and mark as sent
            const sendBtn = document.querySelector('.verification-resend');
            if (sendBtn) {
                sendBtn.dataset.codeSent = 'true';
                const isEnglish = this.currentLanguage === 'en';
                sendBtn.textContent = isEnglish ? 'Resend' : '重新发送';
            }
            
            // Show success message based on server response
            if (response.message) {
                this.showMessage(response.message, 'success');
            } else {
                this.showMessage(this.getMessage('verificationCodeSent'), 'success');
            }
            
            this.startVerificationCountdown();
            this.verificationCodeSent = true;
            
        } catch (error) {
            this.showMessage(this.handleAPIError(error), 'error');
            console.error('Verification code error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    validateVerificationCodeInput() {
        const verificationInput = document.getElementById('verification');
        const code = verificationInput?.value?.trim();
        
        // Remove any existing validation styling
        verificationInput?.classList.remove('error', 'success');
        
        if (code && code.length === 6) {
            if (/^\d{6}$/.test(code)) {
                verificationInput.classList.add('success');
            } else {
                verificationInput.classList.add('error');
            }
        }
    }

    async validateVerificationCodeReal() {
        const verificationInput = document.getElementById('verification');
        const emailInput = document.getElementById('email');
        const code = verificationInput?.value?.trim();
        const email = emailInput?.value?.trim();
        
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
            return;
        }
        
        if (!email || !this.verificationCodeSent) {
            return;
        }

        try {
            // Pre-validate the verification code with server
            const response = await this.makeRequest('/register/validate_code', {
                method: 'POST',
                body: JSON.stringify({ 
                    email: email,
                    verification_code: code 
                })
            });
            
            if (response.success) {
                verificationInput.classList.remove('error');
                verificationInput.classList.add('success');
                this.verificationCodeValid = true;
            } else {
                verificationInput.classList.remove('success');
                verificationInput.classList.add('error');
                this.verificationCodeValid = false;
                this.showMessage(response.message || '验证码错误', 'error');
            }
        } catch (error) {
            // If validation endpoint doesn't exist, skip pre-validation
            console.log('Pre-validation not available, will validate during registration');
            this.verificationCodeValid = null; // Unknown state
        }
    }

    async handleuserInfo(event) {
        event.preventDefault();
        console.log(window.location.origin);

        const birthdate = document.getElementById('birthdate').value;
        const birthtime = document.getElementById('birthtime').value;
        const sex = document.getElementById('gender').value;
        const birthplace = document.getElementById('birthplace').value;

        try {
            // Show loading on the submit button specifically
            const updateInformationButton = document.getElementById('submit');
            if (updateInformationButton) {
                updateInformationButton.disabled = true;
                updateInformationButton.style.opacity = '0.6';
                const originalText = updateInformationButton.textContent;
                updateInformationButton.setAttribute('data-original-text', originalText);
                updateInformationButton.textContent = this.getMessage('updating');
            }
            
            const requestData = {
                dob: birthdate+'T'+birthtime,
                sex: sex,
                birthplace: birthplace,
            };

            const username_token = localStorage.getItem('username_token');
            
            const response = await this.makeRequest('/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${username_token}`,
                },
                body: JSON.stringify(requestData)
            });
            
            this.showMessage(this.getMessage('registerSuccess'), 'success');
            
            // Update navigation with new system
            if (window.NavigationLoader) {
                setTimeout(() => {
                    window.NavigationLoader.reload();
                }, 500);
            }
            
            setTimeout(() => {
                window.location.href = this.currentLanguage === 'zh' ? 'index-zh.html' : 'index.html';
            }, 2000);
            
        } catch (error) {
            this.showMessage(this.handleAPIError(error), 'error');
            console.error('Registration error:', error);
        } finally {
            // Restore register button
            const updateInformationButton = document.getElementById('submit');
            if (updateInformationButton) {
                updateInformationButton.disabled = false;
                updateInformationButton.style.opacity = '1';
                const originalText = updateInformationButton.getAttribute('data-original-text');
                if (originalText) {
                    updateInformationButton.textContent = originalText;
                }
            }
        }
    }
  

    async handleVerification(event) {
        event.preventDefault();

        console.log("current language: ", this.currentLanguage);

        const username = document.getElementById('username').value;
        const verificationCode = document.getElementById('verification').value;

        if (!username || !verificationCode) {
            const message = currentLanguage === 'zh' ? '请填写所有必填字段' : 'Please fill in all required fields';
            alert(message);
            return;
        }

        try {
            // Show loading on the register button specifically
            const registerButton = document.getElementById('verification-submit');
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.style.opacity = '0.6';
                const originalText = registerButton.textContent;
                registerButton.setAttribute('data-original-text', originalText);
                registerButton.textContent = this.getMessage('loading');
            }

            const requestData = {
                username: username,
                confirmation_code: verificationCode
            };
            
            const response = await this.makeRequest('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            this.showMessage(this.getMessage('registerSuccess'), 'success');

            const loginData = {
                login_id: username,
                password: localStorage.getItem('password'),
                remember: false,
            };

            const loginResponse = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            localStorage.setItem('access_token', loginResponse.access_token);
            localStorage.setItem('token_type', loginResponse.token_type);
            localStorage.setItem('username_token', loginResponse.username_token);
            localStorage.setItem('username', loginResponse.username);
            localStorage.removeItem('password');

            console.log("username token set");
            console.log(localStorage.getItem('username_token'));

            this.showMessage(this.getMessage('loginSuccess'), 'success');
            
            if (window.NavigationLoader) {
                console.log("navigation loader");
                setTimeout(() => {
                    window.NavigationLoader.reload();
                }, 500);
            } else {
                console.log("local navigation");
                this.updateNavigation(loginResponse.username);
            }
            
            setTimeout(() => {
                console.log("current language: ", this.currentLanguage);
                console.log("destination: ", this.currentLanguage === 'zh' ? 'userInfo.html?lang=en' : 'userInfo.html?lang=zh');
                window.location.href = this.currentLanguage === 'zh' ? 'userInfo.html?lang=zh' : 'userInfo.html?lang=en';
            }, 2000);
            
        } catch (error) {
            this.showMessage(this.handleAPIError(error), 'error');
            console.error('Registration error:', error);
        } finally {
            // Restore register button
            const registerButton = document.getElementById('register-submit');
            if (registerButton) {
                registerButton.disabled = false;
                registerButton.style.opacity = '1';
                const originalText = registerButton.getAttribute('data-original-text');
                if (originalText) {
                    registerButton.textContent = originalText;
                }
            }
        }
    }
    
    async handleRegister(event) {
        event.preventDefault();

        console.log("into handleregister");
        console.log(window.location.origin);

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const confirmPassword = document.getElementById('confirmPassword').value;
        const agree = document.getElementById('agree').checked;
        
        if (!username || !email || !password || !confirmPassword) {
            const message = currentLanguage === 'zh' ? '请填写所有必填字段' : 'Please fill in all required fields';
            alert(message);
            return;
        }
        
        if (password !== confirmPassword) {
            const message = currentLanguage === 'zh' ? '密码不一致' : 'Passwords do not match';
            alert(message);
            return;
        }
        
        if (!agree) {
            const message = currentLanguage === 'zh' ? '请同意服务条款' : 'Please agree to the terms of service';
            alert(message);
            return;
        }


        try {
            // Show loading on the register button specifically
            const registerButton = document.getElementById('register-submit');
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.style.opacity = '0.6';
                const originalText = registerButton.textContent;
                registerButton.setAttribute('data-original-text', originalText);
                registerButton.textContent = this.getMessage('loading');
            }

            const requestData = {
                username: username,
                email: email,
                password: password
            };

            const response = await this.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            this.showMessage(this.getMessage('registerSuccess'), 'success');

            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
            
            // Update navigation with new system
            if (window.NavigationLoader) {
                setTimeout(() => {
                    window.NavigationLoader.reload();
                }, 500);
            }
            
            // setTimeout(() => {
            //     window.location.href = this.currentLanguage === 'zh' ? 'email-verification.html?lang=en' : 'email-verification.html?lang=zh';
            // }, 2000);
            
        } catch (error) {
            this.showMessage(this.handleAPIError(error), 'error');
            console.error('Registration error:', error);
        } finally {
            // Restore register button
            const registerButton = document.getElementById('register-submit');
            if (registerButton) {
                registerButton.disabled = false;
                registerButton.style.opacity = '1';
                const originalText = registerButton.getAttribute('data-original-text');
                if (originalText) {
                    registerButton.textContent = originalText;
                }
            }
            // Switch to page 2
            document.getElementById('page1').classList.remove('active');
            document.getElementById('page2').classList.add('active');
            document.getElementById('page-indicator').textContent = '2/2';
            document.getElementById('back-btn').style.display = 'flex';
            document.getElementById('verification-title').style.display = 'flex';
            currentPage = 2;
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const remember = document.getElementById('remember')?.checked;

        console.log("remember: ", remember);

        if (!username || !password) {
            this.showMessage(this.getMessage('pleaseEnterEmailPassword'), 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // Check if input is email format or username
            const isEmail = this.isValidEmail(username);
            const email = isEmail ? username : `${username}@example.com`;
            const usernameExtracted = email.split('@')[0];
            
            // 根据环境调整请求数据格式
            const requestData = this.isLocalTest ? {
                username: email,  // 本地测试服务器期望 username 字段
                password: password
            } : {
                login_id: username,   
                password: password,
                remember: remember
            };
            
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            
            // 处理不同服务器的响应格式
            if (this.isLocalTest) {
                // 本地测试服务器响应格式
                if (response.success) {
                    this.showMessage(response.message || this.getMessage('loginSuccess'), 'success');
                    localStorage.setItem('userRegistered', 'true');
                    localStorage.setItem('userInfo', JSON.stringify({ 
                        email: email,
                        username: response.username || usernameExtracted,
                        name: response.name || response.username || usernameExtracted
                    }));
                    
                    if (response.token) {
                        localStorage.setItem('authToken', response.token);
                    }
                    
                    // Update navigation with new system
                    if (window.NavigationLoader) {
                        setTimeout(() => {
                            window.NavigationLoader.reload();
                        }, 500);
                    } else {
                        this.updateNavigation(response.username || usernameExtracted);
                    }
                    
                    setTimeout(() => {
                        window.location.href = this.currentLanguage === 'zh' ? 'index-zh.html' : 'index.html';
                    }, 1500);
                } else {
                    this.showMessage(response.message || this.getMessage('loginFailed'), 'error');
                }
            } else {
                // 生产服务器响应格式
                this.showMessage(this.getMessage('loginSuccess'), 'success');

                localStorage.setItem('token_type', response.token_type);
                localStorage.setItem('username_token', response.username_token);
                localStorage.setItem('access_token', response.access_token);
                
                const userinfoResponse = await this.makeRequest('/users/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${response.username_token}`
                    },
                });
    
                localStorage.setItem('user_id', userinfoResponse.user_id);
                localStorage.setItem('username', userinfoResponse.username);
                localStorage.setItem('email', userinfoResponse.email);


                // Update navigation with new system
                if (window.NavigationLoader) {
                    console.log("navigation loader");
                    setTimeout(() => {
                        window.NavigationLoader.reload();
                    }, 500);
                } else {
                    console.log("local navigation");
                    this.updateNavigation(usernameExtracted);
                }
                
                setTimeout(() => {
                    window.location.href = this.currentLanguage === 'zh' ? 'index-zh.html' : 'index.html';
                }, 1500);
            }
            
        } catch (error) {
            // API服务器不可用，尝试离线模拟登录
            console.log('API服务器不可用，尝试离线模拟登录...');
            
            const offlineResponse = this.tryOfflineLogin(username, password);
            if (offlineResponse.success) {
                // 离线登录成功
                this.showMessage(offlineResponse.message, 'success');
                
                const isEmail = this.isValidEmail(username);
                const email = isEmail ? username : `${username}@example.com`;
                const usernameExtracted = email.split('@')[0];
                
                localStorage.setItem('userRegistered', 'true');
                localStorage.setItem('userInfo', JSON.stringify({ 
                    email: email,
                    username: usernameExtracted,
                    name: offlineResponse.name || usernameExtracted,
                    gender: offlineResponse.gender,
                    birthDate: offlineResponse.birthDate,
                    birthTime: offlineResponse.birthTime,
                    birthDatetime: offlineResponse.birthDatetime,
                    birthLocation: offlineResponse.birthLocation,
                    isOfflineMode: true
                }));
                
                localStorage.setItem('authToken', `offline_token_${Date.now()}`);
                
                // Update navigation
                if (window.NavigationLoader) {
                    setTimeout(() => {
                        window.NavigationLoader.reload();
                    }, 500);
                } else {
                    this.updateNavigation(usernameExtracted);
                }
                
                setTimeout(() => {
                    window.location.href = this.currentLanguage === 'zh' ? 'index-zh.html' : 'index.html';
                }, 1500);
            } else {
                // 离线登录也失败
                this.showMessage(offlineResponse.message, 'error');
            }
            
            console.error('Login error:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    // 离线模拟登录方法
    tryOfflineLogin(username, password) {
        // 演示账户数据库
        const demoUsers = {
            'admin@example.com': { 
                password: '123456', 
                name: '管理员',
                gender: 'female',
                birthDate: '2003-01-02',
                birthTime: '04:05',
                birthDatetime: '2003-01-02 04:05',
                birthLocation: '这里'
            },
            'admin': { 
                password: '123456', 
                name: '管理员',
                gender: 'female',
                birthDate: '2003-01-02',
                birthTime: '04:05',
                birthDatetime: '2003-01-02 04:05',
                birthLocation: '这里'
            }
        };
        
        // 检查用户名（支持邮箱和用户名格式）
        const user = demoUsers[username] || demoUsers[username.toLowerCase()];
        
        if (user && user.password === password) {
            return {
                success: true,
                message: this.getMessage('loginSuccess') + ' (离线模式)',
                name: user.name,
                gender: user.gender,
                birthDate: user.birthDate,
                birthTime: user.birthTime,
                birthDatetime: user.birthDatetime,
                birthLocation: user.birthLocation
            };
        } else {
            return {
                success: false,
                message: this.getMessage('loginFailed')
            };
        }
    }
    
    getRegisterFormData() {
        return {
            username: document.getElementById('username')?.value?.trim(),
            email: document.getElementById('email')?.value?.trim(),
            verificationCode: document.getElementById('verification')?.value?.trim(),
            password: document.getElementById('password')?.value,
            confirmPassword: document.getElementById('confirmPassword')?.value,
            agreeToTerms: document.getElementById('agree')?.checked
        };
    }
    
    validateRegisterForm(data) {
        if (!data.username) {
            return { isValid: false, message: this.getMessage('usernameRequired') };
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            return { isValid: false, message: this.getMessage('validEmailRequired') };
        }
        
        // Check if verification code was sent
        if (!this.verificationCodeSent) {
            return { isValid: false, message: this.getMessage('verificationCodeNotSent') };
        }
        
        // Check verification code format and content
        if (!data.verificationCode) {
            return { isValid: false, message: this.getMessage('verificationCodeRequired') };
        }
        
        // Verify verification code is 6 digits
        if (!/^\d{6}$/.test(data.verificationCode)) {
            return { isValid: false, message: this.getMessage('verificationCodeFormat') };
        }
        
        // Check if verification code was pre-validated as invalid
        if (this.verificationCodeValid === false) {
            return { isValid: false, message: this.getMessage('verificationCodeInvalid') };
        }
        
        if (!data.password || data.password.length < 6) {
            return { isValid: false, message: this.getMessage('passwordMinLength') };
        }
        
        if (data.password !== data.confirmPassword) {
            return { isValid: false, message: this.getMessage('passwordMismatch') };
        }
        
        if (!data.agreeToTerms) {
            return { isValid: false, message: this.getMessage('agreeToTermsRequired') };
        }
        
        return { isValid: true };
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Handle API errors and show user-friendly messages
     * @param {Error} error - Error object
     * @returns {string} - User-friendly error message
     */
    handleAPIError(error) {
        if (error.message.includes('验证码错误')) {
            return '验证码错误，请重新输入';
        }
        
        if (error.message.includes('两次密码不一致')) {
            return '两次密码输入不一致';
        }
        
        if (error.message.includes('邮箱已存在')) {
            return '该邮箱已注册，请直接登录';
        }
        
        if (error.message.includes('网络')) {
            return '网络连接失败，请检查网络设置';
        }
        
        return error.message || '操作失败，请重试';
    }
    
    startVerificationCountdown() {
        const resendBtn = document.querySelector('.verification-resend');
        if (!resendBtn) return;
        
        this.verificationCodeCountdown = 60;
        resendBtn.style.pointerEvents = 'none';
        resendBtn.style.opacity = '0.5';
        
        this.verificationCodeTimer = setInterval(() => {
            this.verificationCodeCountdown--;
            resendBtn.textContent = `${this.verificationCodeCountdown}s`;
            
            if (this.verificationCodeCountdown <= 0) {
                clearInterval(this.verificationCodeTimer);
                // Make sure button text is "Resend" after countdown
                const isEnglish = this.currentLanguage === 'en';
                resendBtn.textContent = isEnglish ? 'Resend' : '重新发送';
                resendBtn.style.pointerEvents = 'auto';
                resendBtn.style.opacity = '1';
            }
        }, 1000);
    }
    
    showLoading(show, targetButton = null) {
        // If no specific button is provided, target the verification send button for loading
        const button = targetButton || document.querySelector('.verification-resend');
        
        if (button) {
            if (show) {
                button.disabled = true;
                button.style.opacity = '0.6';
                const originalText = button.textContent;
                button.setAttribute('data-original-text', originalText);
                button.textContent = this.getMessage('loading');
            } else {
                button.disabled = false;
                button.style.opacity = '1';
                const originalText = button.getAttribute('data-original-text');
                if (originalText) {
                    button.textContent = originalText;
                }
            }
        }
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            transition: all 0.3s ease;
            transform: translateX(400px);
        `;
        
        switch (type) {
            case 'success':
                messageDiv.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                break;
            case 'error':
                messageDiv.style.background = 'linear-gradient(45deg, #f44336, #da190b)';
                break;
            default:
                messageDiv.style.background = 'linear-gradient(45deg, #2196F3, #0b7dda)';
        }
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(messageDiv)) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 4000);
    }
    
    getMessage(key) {
        const messages = {
            zh: {
                pleaseEnterEmail: '请输入邮箱地址',
                invalidEmail: '请输入有效的邮箱地址',
                verificationCodeSent: '验证码已发送，请查收邮件',
                usernameRequired: '请输入用户名',
                validEmailRequired: '请输入有效的邮箱地址',
                verificationCodeNotSent: '请先发送验证码',
                verificationCodeRequired: '请输入邮箱验证码',
                verificationCodeFormat: '验证码必须是6位数字',
                verificationCodeInvalid: '验证码错误，请重新输入',
                passwordMinLength: '密码至少需要6个字符',
                passwordMismatch: '两次输入的密码不一致',
                agreeToTermsRequired: '请同意服务条款',
                registerSuccess: '注册成功！正在跳转...',
                registerFailed: '注册失败，请重试',
                pleaseEnterEmailPassword: '请输入邮箱和密码',
                loginSuccess: '登录成功！正在跳转...',
                loginFailed: '登录失败，请检查邮箱和密码',
                loading: '处理中...',
                resendCode: '重新发送',
                logoutSuccess: '已退出登录',
                pleaseEnterUsername: '请输入用户名',
            },
            en: {
                pleaseEnterEmail: 'Please enter email address',
                invalidEmail: 'Please enter a valid email address',
                verificationCodeSent: 'Verification code sent, please check your email',
                usernameRequired: 'Please enter your username',
                validEmailRequired: 'Please enter a valid email address',
                verificationCodeNotSent: 'Please send verification code first',
                verificationCodeRequired: 'Please enter email verification code',
                verificationCodeFormat: 'Verification code must be 6 digits',
                verificationCodeInvalid: 'Invalid verification code, please re-enter',
                passwordMinLength: 'Password must be at least 6 characters',
                passwordMismatch: 'Passwords do not match',
                agreeToTermsRequired: 'Please agree to the terms of service',
                registerSuccess: 'Registration successful! Redirecting...',
                registerFailed: 'Registration failed, please try again',
                pleaseEnterEmailPassword: 'Please enter email and password',
                pleaseEnterUsername: 'Please enter username',
                loginSuccess: 'Login successful! Redirecting...',
                loginFailed: 'Login failed, please check email and password',
                loading: 'Processing...',
                resendCode: 'Resend',
                logoutSuccess: 'Logged out successfully'
            }
        };
        
        return messages[this.currentLanguage]?.[key] || messages.zh[key] || key;
    }
    
    // 检查登录状态
    async checkLoginStatus() {
        const username_token = localStorage.getItem('username_token');
        
        if (username_token !== null) {
            try {
                const response = await this.makeRequest('/users/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${username_token}`
                    },
                });

                console.log("successful response: ", response);

                localStorage.setItem('user_id', response.user_id);
                localStorage.setItem('username', response.username);
                localStorage.setItem('email', response.email);

                // 显示用户名（邮箱@之前的部分）
                const displayName = response.username;
                
                // Use new navigation system if available
                if (window.NavigationLoader) {
                    // The new navigation system will automatically detect login status
                    // No need to manually update navigation here
                } else {
                    this.updateNavigation(displayName);
                }
            } catch (error) {
                console.error('解析用户信息失败:', error);
                this.logout();
            }
        }
    }
    
    // 更新导航栏
    updateNavigation(userName) {
        const navAuth = document.querySelector('.nav-auth');
        if (!navAuth) return;
        
        // 创建用户菜单
        navAuth.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${userName}</span>
                <button class="logout-btn" onclick="window.authSystem.logout()">退出</button>
            </div>
        `;
        
        // 添加用户菜单样式
        this.addUserMenuStyles();
    }
    
    // 添加用户菜单样式
    addUserMenuStyles() {
        if (document.getElementById('user-menu-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'user-menu-styles';
        style.textContent = `
            .user-menu {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .user-name {
                color: #ffffff;
                font-size: 0.9rem;
                font-weight: 600;
                padding: 0.6rem 1.2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .logout-btn {
                color: rgba(255, 255, 255, 0.8);
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 0.6rem 1.2rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .logout-btn:hover {
                color: #ffffff;
                border-color: rgba(255, 255, 255, 0.6);
                background: rgba(255, 255, 255, 0.05);
            }
            
            @media screen and (max-width: 768px) {
                .user-menu {
                    gap: 0.5rem;
                }
                
                .user-name {
                    font-size: 0.8rem;
                    padding: 0.5rem 1rem;
                }
                
                .logout-btn {
                    font-size: 0.75rem;
                    padding: 0.5rem 1rem;
                }
            }
            
            @media screen and (max-width: 480px) {
                .user-name {
                    font-size: 0.75rem;
                    padding: 0.4rem 0.8rem;
                }
                
                .logout-btn {
                    font-size: 0.7rem;
                    padding: 0.4rem 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 退出登录
    logout() {
        localStorage.removeItem('username_token');
        localStorage.removeItem('access_token');
        
        // Use new navigation system if available
        if (window.NavigationLoader) {
            this.showMessage(this.getMessage('logoutSuccess'), 'success');
            setTimeout(() => {
                window.NavigationLoader.reload();
            }, 500);
        } else {
            // Fallback to old system
            const navAuth = document.querySelector('.nav-auth');
            if (navAuth) {
                const isEnglish = this.currentLanguage === 'en';
                navAuth.innerHTML = `
                    <a href="login.html${isEnglish ? '?lang=en' : ''}" class="login-btn">${isEnglish ? 'Log In' : '登录'}</a>
                    <a href="register.html${isEnglish ? '?lang=en' : ''}" class="signup-btn">${isEnglish ? 'Sign Up' : '注册'}</a>
                    <a href="${isEnglish ? 'index.html' : 'index-zh.html'}" class="lang-btn">${isEnglish ? 'ZH' : 'EN'}</a>
                `;
            }
            this.showMessage(this.getMessage('logoutSuccess'), 'success');
        }
    }
}

// 全局实例
window.authSystem = new AuthSystem();
