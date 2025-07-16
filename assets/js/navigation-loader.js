/**
 * Navigation Loader - Shared Navigation Component System
 * Dynamically loads and configures navigation bar for all HTML files
 */

(function() {
    'use strict';

    // Navigation configuration based on page type and language
    var NavigationConfig = {
        // Detect current page language
        detectLanguage: function() {
            // Check URL parameter first
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang');
            if (langParam === 'en' || langParam === 'zh') {
                return langParam;
            }
            
            // Check filename patterns
            if (window.location.pathname.includes('index-zh.html')) {
                return 'zh';
            }
            
            // Check for curve page with referrer
            if (window.location.pathname.includes('curve/')) {
                if (document.referrer.includes('index-zh.html') || 
                    document.referrer.includes('lang=zh')) {
                    return 'zh';
                } else if (document.referrer.includes('index.html') || 
                          document.referrer.includes('lang=en')) {
                    return 'en';
                }
                // Default to Chinese for curve page
                return 'zh';
            }
            
            // Check for login/register pages with referrer
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                if (document.referrer.includes('index.html') && !document.referrer.includes('index-zh.html')) {
                    return 'en';
                } else if (document.referrer.includes('index-zh.html')) {
                    return 'zh';
                }
                // Default to Chinese
                return 'en';
            }
            
            // Default based on filename (English for index.html, Chinese otherwise)
            return !window.location.pathname.includes('index-zh.html') ? 'en' : 'zh';
        },

        // Get page type
        getPageType: function() {
            const pathname = window.location.pathname;
            if (pathname.includes('curve/')) return 'curve';
            if (pathname.includes('login.html')) return 'login';
            if (pathname.includes('register.html')) return 'register';
            if (pathname.includes('user-settings.html')) return 'user-settings';
            if (pathname.includes('password-change.html')) return 'password-change';
            if (pathname.includes('index-zh.html')) return 'home-zh';
            if (pathname.includes('index.html')) return 'home-en';
            return 'home-zh'; // default
        },

        // Check if user is logged in
        isUserLoggedIn: function() {
            const userRegistered = localStorage.getItem('userRegistered');
            const userInfo = localStorage.getItem('userInfo');
            return userRegistered === 'true' && userInfo;
        },

        // Get logged in user info
        getLoggedInUser: function() {
            if (!this.isUserLoggedIn()) return null;
            
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                return {
                    displayName: userInfo.name || userInfo.username || userInfo.email?.split('@')[0] || 'User',
                    email: userInfo.email,
                    name: userInfo.name,
                    username: userInfo.username
                };
            } catch (error) {
                console.error('Error parsing user info:', error);
                return null;
            }
        },

        // Get navigation data based on language and page type
        getNavigationData: function(language, pageType) {
            const isEnglish = language === 'en';
            const isCurvePage = pageType === 'curve';
            const isLoginRegisterPage = pageType === 'login' || pageType === 'register';
            const isLoggedIn = this.isUserLoggedIn();
            const userInfo = this.getLoggedInUser();
            
            // Base path for relative URLs
            const basePath = isCurvePage ? '../' : '';

            return {
                logo: {
                    src: basePath + 'images/LOGO.png',
                    alt: 'Timing Logo',
                    text: 'Timing',
                    href: language === 'zh' ? 'index-zh.html' : 'index.html',
                },
                menuItems: [
                    {
                        text: isEnglish ? 'Introduction' : '简介',
                        href: this.getMenuItemHref('intro', language, pageType),
                        id: 'intro'
                    },
                    {
                        text: isEnglish ? 'Event Timing' : '事件择时',
                        href: this.getMenuItemHref('work', language, pageType),
                        id: 'work'
                    },
                    {
                        text: isEnglish ? 'Energy Curve' : '能量曲线',
                        href: this.getMenuItemHref('curve', language, pageType),
                        id: 'curve',
                        active: pageType === 'curve'
                    },
                    {
                        text: isEnglish ? 'Contact' : '联系我们',
                        href: this.getMenuItemHref('contact', language, pageType),
                        id: 'contact'
                    }
                ],
                authButtons: this.getAuthButtons(language, pageType, isLoggedIn, userInfo),
                isEnglishPage: isEnglish,
                isLoggedIn: isLoggedIn,
                userInfo: userInfo
            };
        },

        // Get auth buttons based on login status
        getAuthButtons: function(language, pageType, isLoggedIn, userInfo) {
            const isEnglish = language === 'en';
            
            if (isLoggedIn && userInfo) {
                // User is logged in - show user menu
                return [
                    {
                        text: userInfo.displayName,
                        href: this.getUserSettingsHref(language, pageType),
                        class: 'user-name-btn',
                        id: 'user-name',
                        type: 'user-display'
                    },
                    {
                        text: isEnglish ? 'Logout' : '退出',
                        href: '#',
                        class: 'logout-btn',
                        id: 'logout',
                        type: 'logout'
                    },
                    {
                        text: isEnglish ? '中文' : 'ENG',
                        href: this.getLanguageSwitchHref(language, pageType),
                        class: 'lang-btn',
                        id: 'lang-switch',
                        type: 'language'
                    }
                ];
            } else {
                // User not logged in - show login/register buttons
                return [
                    {
                        text: isEnglish ? 'SIGN IN' : '登录',
                        href: this.getAuthHref('login', language, pageType),
                        class: 'login-btn',
                        id: 'login',
                        type: 'login'
                    },
                    {
                        text: isEnglish ? 'SIGN UP' : '注册',
                        href: this.getAuthHref('register', language, pageType),
                        class: 'signup-btn',
                        id: 'signup',
                        type: 'signup'
                    },
                    {
                        text: isEnglish ? '中文' : 'ENG',
                        href: this.getLanguageSwitchHref(language, pageType),
                        class: 'lang-btn',
                        id: 'lang-switch',
                        type: 'language'
                    }
                ];
            }
        },

        // Get menu item href based on context
        getMenuItemHref: function(item, language, pageType) {
            const isEnglish = language === 'en';
            const isCurvePage = pageType === 'curve';
            const isLoginRegisterPage = pageType === 'login' || pageType === 'register';
            const isUserSettingsPage = pageType === 'user-settings' || pageType === 'password-change';
            
            if (item === 'curve') {
                const curvePage = isCurvePage ? '#' : 
                    (isEnglish ? 'curve/index_curve.html?lang=en' : 'curve/index_curve.html?lang=zh');
                return isCurvePage ? curvePage : (pageType.includes('curve') ? '../' : '') + curvePage;
            }
            
            if (isLoginRegisterPage || isCurvePage || isUserSettingsPage) {
                const mainPage = isEnglish ? 'index.html' : 'index-zh.html';
                const basePath = isCurvePage ? '../' : '';
                return basePath + mainPage + '#' + item;
            }
            
            return '#' + item;
        },

        // Get auth button href
        getAuthHref: function(type, language, pageType) {
            const isEnglish = language === 'en';
            const isCurvePage = pageType === 'curve';
            const basePath = isCurvePage ? '../' : '';
            const langParam = '?lang=' + language;
            
            return basePath + type + '.html' + langParam;
        },

        // Get language switch href
        getLanguageSwitchHref: function(currentLanguage, pageType) {
            const newLanguage = currentLanguage === 'en' ? 'zh' : 'en';
            const isCurvePage = pageType === 'curve';
            const isLoginRegisterPage = pageType === 'login' || pageType === 'register';
            const isUserSettingsPage = pageType === 'user-settings' || pageType === 'password-change';
            
            if (isCurvePage) {
                return currentLanguage === 'en' ? '../index-zh.html' : '../index.html';
            }
            
            if (isLoginRegisterPage || isUserSettingsPage) {
                const currentPage = window.location.pathname.split('/').pop();
                return currentPage + '?lang=' + newLanguage;
            }
            
                return currentLanguage === 'en' ? 'index-zh.html' : 'index.html';
          },
 
          // Get user settings page href
          getUserSettingsHref: function(language, pageType) {
              const isCurvePage = pageType === 'curve';
              const basePath = isCurvePage ? '../' : '';
              const langParam = '?lang=' + language;
              
              return basePath + 'user-settings.html' + langParam;
          }
    };

    // Navigation renderer
    var NavigationRenderer = {
        // Render the complete navigation HTML
        render: function(data) {
            return `
                <nav class="top-navigation">
                    <div class="nav-container">
                        <div class="nav-logo" onclick="goToHomePage()" style="cursor: pointer;">
                            <img src="${data.logo.src}" alt="${data.logo.alt}" />
                            <span class="logo-text">${data.logo.text}</span>
                        </div>
                        <div class="nav-menu">
                            ${data.menuItems.map(item => 
                                `<a href="${item.href}" class="nav-item${item.active ? ' active' : ''}" data-nav-id="${item.id}">${item.text}</a>`
                            ).join('')}
                        </div>
                        <div class="nav-auth${data.isEnglishPage ? ' english-page' : ''}${data.isLoggedIn ? ' logged-in' : ''}">
                            ${data.authButtons.map(button => 
                                `<a href="${button.href}" class="${button.class}" data-auth-id="${button.id}" data-auth-type="${button.type || ''}">${button.text}</a>`
                            ).join('')}
                        </div>
                    </div>
                </nav>
            `;
        },

        // Insert navigation into the page
        insertIntoPage: function(navigationHTML) {
            // Remove existing navigation if any
            const existingNav = document.querySelector('.top-navigation');
            if (existingNav) {
                existingNav.remove();
            }

            // Insert at the beginning of body
            document.body.insertAdjacentHTML('afterbegin', navigationHTML);
            
            // Add user menu styles if user is logged in
            if (NavigationConfig.isUserLoggedIn()) {
                this.addUserMenuStyles();
            }
        },

        // Add user menu styles
        addUserMenuStyles: function() {
            if (document.getElementById('user-menu-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'user-menu-styles';
            style.textContent = `
                .nav-auth.logged-in {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .nav-auth .user-name-btn {
                    color: #ffffff !important;
                    font-size: 0.9rem;
                    font-weight: 600;
                    padding: 0.6rem 1.2rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                                          border: 1px solid rgba(255, 255, 255, 0.2);
                      text-decoration: none;
                                            cursor: pointer;
                      transition: all 0.3s ease;
                  }
                  
                  .nav-auth .user-name-btn:hover {
                      background: rgba(255, 255, 255, 0.15);
                      border-color: rgba(255, 255, 255, 0.3);
                      transform: translateY(-1px);
                  }
                
                .nav-auth .logout-btn {
                    color: rgba(255, 255, 255, 0.8) !important;
                    background: none;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 0.6rem 1.2rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }
                
                .nav-auth .logout-btn:hover {
                    color: #ffffff !important;
                    border-color: rgba(255, 255, 255, 0.6);
                    background: rgba(255, 255, 255, 0.05);
                }
                
                @media screen and (max-width: 768px) {
                    .nav-auth.logged-in {
                        gap: 0.5rem;
                    }
                    
                    .nav-auth .user-name-btn {
                        font-size: 0.8rem;
                        padding: 0.5rem 1rem;
                    }
                    
                    .nav-auth .logout-btn {
                        font-size: 0.75rem;
                        padding: 0.5rem 1rem;
                    }
                }
                
                @media screen and (max-width: 480px) {
                    .nav-auth .user-name-btn {
                        font-size: 0.75rem;
                        padding: 0.4rem 0.8rem;
                    }
                    
                    .nav-auth .logout-btn {
                        font-size: 0.7rem;
                        padding: 0.4rem 0.8rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // Navigation loader main class
    var NavigationLoader = {
        // Initialize the navigation system
        init: function() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.load.bind(this));
            } else {
                this.load();
            }
        },

        // Load and render navigation
        load: function() {
            try {
                const language = NavigationConfig.detectLanguage();
                const pageType = NavigationConfig.getPageType();
                const navigationData = NavigationConfig.getNavigationData(language, pageType);
                
                const navigationHTML = NavigationRenderer.render(navigationData);
                NavigationRenderer.insertIntoPage(navigationHTML);
                
                // Set up event handlers
                this.setupEventHandlers(language, pageType);
                
                // Notify that navigation is loaded
                this.dispatchNavigationLoadedEvent();
                
            } catch (error) {
                console.error('Navigation loader error:', error);
            }
        },

        // Reload navigation (useful after login/logout)
        reload: function() {
            this.load();
        },

        // Set up event handlers for navigation
        setupEventHandlers: function(language, pageType) {
            // Logo click handler
            window.goToHomePage = function() {
                const isCurvePage = pageType === 'curve';
                const isLoginRegisterPage = pageType === 'login' || pageType === 'register';
                const isUserSettingsPage = pageType === 'user-settings' || pageType === 'password-change';
                
                if (isLoginRegisterPage || isCurvePage || isUserSettingsPage) {
                    const mainPage = language === 'zh' ? 'index-zh.html' : 'index.html';
                    const basePath = isCurvePage ? '../' : '';
                    window.location.href = basePath + mainPage;
                    return;
                }
                
                // If we're on main page and in an article view, return to homepage
                if (typeof window.Navigation !== 'undefined' && 
                    document.body.classList.contains('is-article-visible')) {
                    window.Navigation.returnToHome();
                } else {
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };

            // Language switch handler
            const langButton = document.querySelector('[data-auth-id="lang-switch"]');
            if (langButton) {
                langButton.addEventListener('click', function(e) {
                    if (pageType === 'curve') {
                        // For curve page, handle session storage
                        e.preventDefault();
                        sessionStorage.setItem('returnFromEnergy', 'true');
                        window.location.href = this.href;
                    }
                    // For other pages, let the default href handle it
                });
            }

            // Logout button handler
            const logoutButton = document.querySelector('[data-auth-id="logout"]');
            if (logoutButton) {
                logoutButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    NavigationLoader.handleLogout(language);
                });
            }
        },

        // Handle logout functionality
        handleLogout: function(language) {
            // Clear user data (same as auth.js logout function)
            localStorage.removeItem('userRegistered');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            
            // Show logout message
            this.showMessage(language === 'en' ? 'Logged out successfully' : '已退出登录', 'success');
            
            // Reload navigation to show login/register buttons
            setTimeout(() => {
                this.reload();
            }, 1000);
        },

        // Show message (similar to auth.js)
        showMessage: function(message, type = 'info') {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 10000;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                font-size: 0.9rem;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
            }, 3000);
        },

        // Dispatch custom event when navigation is loaded
        dispatchNavigationLoadedEvent: function() {
            const event = new CustomEvent('navigationLoaded', {
                detail: {
                    timestamp: Date.now(),
                    language: NavigationConfig.detectLanguage(),
                    pageType: NavigationConfig.getPageType(),
                    isLoggedIn: NavigationConfig.isUserLoggedIn(),
                    userInfo: NavigationConfig.getLoggedInUser()
                }
            });
            document.dispatchEvent(event);
        }
    };

    // Auto-initialize when script loads
    NavigationLoader.init();

    // Export for global access
    window.NavigationLoader = NavigationLoader;
    window.NavigationConfig = NavigationConfig;

    // Listen for storage changes to update navigation when login state changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'userRegistered' || e.key === 'userInfo') {
            setTimeout(() => {
                NavigationLoader.reload();
            }, 100);
        }
    });

})(); 