/**
 * Simple Appwrite Authentication with English/Chinese Support
 */

import { Client, Account, ID, Databases } from 'https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm';

class AppwriteAuth {
    constructor() {
        this.client = new Client()
            .setEndpoint('https://nyc.cloud.appwrite.io/v1')
            .setProject('687e9ce90019a4719c33');
        this.account = new Account(this.client);
        this.databases = new Databases(this.client); // Ensure databases is initialized
        this.currentLanguage = this.detectLanguage();
    }
    
    detectLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam === 'en' || langParam === 'zh') {
            return langParam;
        }
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.startsWith('zh') ? 'zh' : 'en';
    }
    
    async register(email, password, name) {
        try {
            if (!this.isValidEmail(email)) {
                return {
                    success: false,
                    message: this.currentLanguage === 'zh' ? '邮箱格式不正确' : 'Invalid email format'
                };
            }
            
            const user = await this.account.create(ID.unique(), email, password, name);
            
            // Store username mapping for login with username
            this.storeUsernameMapping(name, email);
            
            // Auto-login after registration
            await this.login(email, password);
            
            return {
                success: true,
                message: this.currentLanguage === 'zh' ? '注册成功！' : 'Registration successful!'
            };
        } catch (error) {
            return {
                success: false,
                message: this.handleAppwriteError(error)
            };
        }
    }
    
    async login(usernameOrEmail, password) {
        try {
            let email = usernameOrEmail;
            
            // If input is not an email, try to find email by username
            if (!this.isValidEmail(usernameOrEmail)) {
                email = this.getEmailByUsername(usernameOrEmail);
                if (!email) {
                    return {
                        success: false,
                        message: this.currentLanguage === 'zh' ? '用户名或邮箱不存在' : 'Username or email not found'
                    };
                }
            }
            
            const session = await this.account.createEmailSession(email, password);
            const user = await this.account.get();
            
            // Store user info in localStorage
            localStorage.setItem('userRegistered', 'true');
            localStorage.setItem('userInfo', JSON.stringify({
                email: user.email,
                username: user.name || user.email.split('@')[0],
                name: user.name,
                user_id: user.$id
            }));
            
            return {
                success: true,
                message: this.currentLanguage === 'zh' ? '登录成功！' : 'Login successful!'
            };
        } catch (error) {
            return {
                success: false,
                message: this.handleAppwriteError(error)
            };
        }
    }
    
    async logout() {
        try {
            try {
                await this.account.get();
                await this.account.deleteSessions();
            } catch (sessionError) {
                console.log('No active session to delete');
            }
            
            // Clear localStorage
            localStorage.removeItem('userRegistered');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('username_token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
            
            return { success: true, message: this.currentLanguage === 'zh' ? '已退出登录' : 'Logged out successfully' };
        } catch (error) {
            localStorage.removeItem('userRegistered');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('username_token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
            
            return { success: true, message: this.currentLanguage === 'zh' ? '已退出登录' : 'Logged out successfully' };
        }
    }
    
    isLoggedIn() {
        return localStorage.getItem('userRegistered') === 'true';
    }
    
    getCurrentUser() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            return null;
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    storeUsernameMapping(username, email) {
        try {
            const mappings = JSON.parse(localStorage.getItem('usernameMappings') || '{}');
            mappings[username.toLowerCase()] = email;
            localStorage.setItem('usernameMappings', JSON.stringify(mappings));
        } catch (error) {
            console.error('Error storing username mapping:', error);
        }
    }
    
    getEmailByUsername(username) {
        try {
            const mappings = JSON.parse(localStorage.getItem('usernameMappings') || '{}');
            return mappings[username.toLowerCase()];
        } catch (error) {
            return null;
        }
    }
    
    handleAppwriteError(error) {
        const errorMessage = error.message || error.toString();
        
        if (errorMessage.includes('Invalid credentials')) {
            return this.currentLanguage === 'zh' ? '邮箱或密码错误' : 'Invalid email or password';
        }
        if (errorMessage.includes('User already exists')) {
            return this.currentLanguage === 'zh' ? '该邮箱已注册，请直接登录' : 'This email is already registered, please login directly';
        }
        if (errorMessage.includes('Invalid email')) {
            return this.currentLanguage === 'zh' ? '邮箱格式不正确' : 'Invalid email format';
        }
        if (errorMessage.includes('Password')) {
            return this.currentLanguage === 'zh' ? '密码格式不正确' : 'Invalid password format';
        }
        if (errorMessage.includes('Network')) {
            return this.currentLanguage === 'zh' ? '网络连接错误，请检查网络连接' : 'Network connection error, please check your connection';
        }
        
        return this.currentLanguage === 'zh' ? '操作失败，请重试' : 'Operation failed, please try again';
    }
    
    showMessage(message, type = 'info') {
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    async saveCalculationData({ name, birthdate, birthtime, gender, birthplace }) {
        console.log('Appwrite saveCalculationData called', { name, birthdate, birthtime, gender, birthplace });
        // Always use the initialized this.account and this.databases
        const user = await this.account.get();
        const userId = user.$id;
        const email = user.email;
        const databaseId = '687fa352001b3368f4cf';
        const collectionId = '687fa3610004f180c7a1';
        const data = {
            userId,
            email,
            Inputname: name,
            birthdate, // should be a datetime string
            birthtime,
            gender,
            birthplace,
            createdAt: new Date().toISOString()
        };
        const result = await this.databases.createDocument(databaseId, collectionId, 'unique()', data);
        console.log('Appwrite document created', result);
        return result;
    }
}

window.AppwriteAuth = AppwriteAuth; 