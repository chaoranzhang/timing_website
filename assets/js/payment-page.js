// Payment Page System
class PaymentPage {
    constructor() {
        this.currentLanguage = 'zh';
        this.stripe = null;
        this.init();
    }
    
    init() {
        this.detectLanguage();
        this.updatePageText();
        this.setupEventHandlers();
        this.initializeStripe();
    }
    
    detectLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        console.log('URL lang parameter:', langParam);
        if (langParam === 'en') {
            this.currentLanguage = 'en';
        }
        console.log('Current language set to:', this.currentLanguage);
    }
    
    setupEventHandlers() {
        // Payment button click handler
        const paymentButton = document.getElementById('payment-button');
        if (paymentButton) {
            paymentButton.addEventListener('click', (e) => this.handlePayment(e));
        }
        
        // Update back link with language parameter
        const backLink = document.getElementById('back-link');
        if (backLink) {
            backLink.href = `index.html?lang=${this.currentLanguage}`;
        }
    }
    
    initializeStripe() {
        // Initialize Stripe with publishable key from config
        const publishableKey = window.CONFIG?.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY_HERE';
        this.stripe = Stripe(publishableKey);
        console.log('Stripe initialized with key:', publishableKey.substring(0, 20) + '...');
    }
    
    async handlePayment(event) {
        event.preventDefault();
        
        const paymentButton = document.getElementById('payment-button');
        const buttonText = document.getElementById('payment-button-text');
        
        // Disable button and show loading
        paymentButton.disabled = true;
        buttonText.textContent = this.currentLanguage === 'zh' ? '处理中...' : 'Processing...';
        
        try {
            // Get configuration values
            const config = window.CONFIG || {};
            const apiBaseUrl = config.API_BASE_URL || 'http://localhost:8000';
            const paymentAmount = config.PAYMENT_AMOUNT || 99;
            const paymentCurrency = config.PAYMENT_CURRENCY || 'usd';
            
            console.log('Config:', config);
            console.log('API Base URL:', apiBaseUrl);
            
            // Prepare URLs with proper scheme - use localhost for development
            const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const baseUrl = isLocalDevelopment ? 'http://localhost:8080' : `${window.location.protocol}//${window.location.host}`;
            
            const successUrl = `${baseUrl}/payment-success.html?lang=${this.currentLanguage}`;
            const cancelUrl = `${baseUrl}/payment.html?lang=${this.currentLanguage}`;
            
            console.log('Payment URLs:', { successUrl, cancelUrl, protocol: window.location.protocol, host: window.location.host });
            
            // Get user email from localStorage if logged in
            let userEmail = null;
            try {
                const userInfo = localStorage.getItem('userInfo');
                console.log('User info from localStorage:', userInfo);
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    userEmail = user.email;
                    console.log('Extracted user email:', userEmail);
                }
            } catch (e) {
                console.log('No user info found:', e);
            }
            
            // Create checkout session with your backend
            const requestBody = {
                price: paymentAmount, // $0.99 in cents
                currency: paymentCurrency,
                language: this.currentLanguage,
                success_url: successUrl,
                cancel_url: cancelUrl,
                customer_email: userEmail // Include user's email
            };
            
            console.log('Sending request to:', `${apiBaseUrl}/create-checkout-session`);
            console.log('Request body:', requestBody);
            
            const response = await fetch(`${apiBaseUrl}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }
            
            const session = await response.json();
            
            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: session.id
            });
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            
            // Reset button to original state
            buttonText.textContent = this.currentLanguage === 'zh' ? '立即抢购' : 'Claim Offer';
            paymentButton.disabled = false;
            
            // Show error notification
            this.showNotification(
                this.currentLanguage === 'zh' ? '支付处理失败，请重试' : 'Payment processing failed, please try again',
                'error'
            );
        }
    }
    
    simulateStripeCheckoutSuccess() {
        // Mark payment as successful for demo
        sessionStorage.setItem('payment_status', 'paid');
        sessionStorage.setItem('payment_date', new Date().toISOString());
        
        // Show success message
        this.showSuccessMessage();
        
        // Redirect back to main page after delay
        setTimeout(() => {
            window.location.href = `index.html?lang=${this.currentLanguage}`;
        }, 2000);
    }
    
    showSuccessMessage() {
        const buttonText = document.getElementById('payment-button-text');
        const paymentButton = document.getElementById('payment-button');
        
        // Show success state briefly
        buttonText.textContent = this.currentLanguage === 'zh' ? '支付成功！' : 'Payment Successful!';
        paymentButton.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        paymentButton.disabled = true;
        
        // Show success notification
        this.showNotification(
            this.currentLanguage === 'zh' ? '支付成功！正在返回首页...' : 'Payment successful! Returning to homepage...',
            'success'
        );
        
        // Reset button after a short delay (before redirect)
        setTimeout(() => {
            buttonText.textContent = this.currentLanguage === 'zh' ? '立即抢购' : 'Claim Offer';
            paymentButton.style.background = '';
            paymentButton.disabled = false;
        }, 1500);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        let background;
        
        switch (type) {
            case 'success':
                background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                break;
            case 'error':
                background = 'linear-gradient(45deg, #f44336, #da190b)';
                break;
            default:
                background = 'linear-gradient(45deg, #2196F3, #0b7dda)';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 10000;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
            background: ${background};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    updatePageText() {
        console.log('updatePageText called with language:', this.currentLanguage);
        const translations = {
            zh: {
                title: '限时特惠：解锁能量流分析',
                subtitle: '特别活动：仅需 $0.99 获得一年的能量流分析功能访问权限',
                feature1: '完整的能量流分析',
                feature2: '健康、事业、爱情预测',
                feature3: '一年内无限次使用',
                payButton: '立即抢购',
                processing: '处理中...',
                success: '支付成功！',
                secure: '',
                backLink: '← 返回首页',
                pricePeriod: '/年',
                originalPrice: '原价 $59.99',
                onlyPrice: '仅需 $0.99/年'
            },
            en: {
                title: 'Limited Time: Unlock Energy Flow Analysis',
                subtitle: 'Special Event: Get 1 year access for just $0.99',
                feature1: 'Complete energy flow analysis',
                feature2: 'Health, career, and love predictions',
                feature3: 'Unlimited usage for 1 year',
                payButton: 'Claim Offer',
                processing: 'Processing...',
                success: 'Payment Successful!',
                secure: '',
                backLink: '← Back to Homepage',
                pricePeriod: '/year',
                originalPrice: 'Original $59.99',
                onlyPrice: 'Only $0.99/year'
            }
        };
        
        const t = translations[this.currentLanguage] || translations.zh;
        
        // Update page text
        const title = document.getElementById('payment-title');
        const subtitle = document.getElementById('payment-subtitle');
        const feature1 = document.getElementById('feature-1');
        const feature2 = document.getElementById('feature-2');
        const feature3 = document.getElementById('feature-3');
        const payButton = document.getElementById('payment-button-text');
        const secure = document.getElementById('payment-info');
        const backLink = document.getElementById('back-link');
        const originalPrice = document.getElementById('original-price');
        const onlyPrice = document.getElementById('only-price');
        
        if (title) title.textContent = t.title;
        if (subtitle) subtitle.textContent = t.subtitle;
        if (feature1) feature1.textContent = t.feature1;
        if (feature2) feature2.textContent = t.feature2;
        if (feature3) feature3.textContent = t.feature3;
        if (payButton) payButton.textContent = t.payButton;
        if (secure) secure.textContent = t.secure;
        if (backLink) backLink.textContent = t.backLink;
        if (originalPrice) {
            originalPrice.textContent = t.originalPrice;
            console.log('Updated originalPrice to:', t.originalPrice);
        }
        if (onlyPrice) {
            onlyPrice.textContent = t.onlyPrice;
            console.log('Updated onlyPrice to:', t.onlyPrice);
        }
    }
}

// Initialize payment page when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Initializing PaymentPage...');
        window.PaymentPage = new PaymentPage();
        console.log('PaymentPage initialized:', window.PaymentPage);
    });
} else {
    console.log('Initializing PaymentPage (document already ready)...');
    window.PaymentPage = new PaymentPage();
    console.log('PaymentPage initialized:', window.PaymentPage);
} 