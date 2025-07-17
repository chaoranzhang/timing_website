/**
 * Language Switcher - Dynamic Language Switching System
 * Handles language switching without page reloads using JSON translations
 */

(function() {
    'use strict';

    // Language switcher object
    var LanguageSwitcher = {
        
        // Current language
        currentLanguage: 'en',
        
        // Translations cache
        translations: null,
        
        // Initialize the language switcher
        init: function() {
            this.loadTranslations();
            this.setupLanguageDetection();
            this.setupEventHandlers();
        },
        
        // Load translations from JSON file
        loadTranslations: function() {
            fetch('assets/js/translations.json')
                .then(response => response.json())
                .then(data => {
                    this.translations = data;
                    this.applyLanguage(this.currentLanguage);
                })
                .catch(error => {
                    console.error('Error loading translations:', error);
                });
        },
        
        // Detect initial language from URL or browser
        setupLanguageDetection: function() {
            // Check URL parameter first
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang');
            
            if (langParam === 'en' || langParam === 'zh') {
                this.currentLanguage = langParam;
            } else {
                // Check browser language
                const browserLang = navigator.language || navigator.userLanguage;
                this.currentLanguage = browserLang.startsWith('zh') ? 'zh' : 'en';
            }
            
            // Update URL to reflect current language
            this.updateURL();
        },
        
        // Setup event handlers for language switching
        setupEventHandlers: function() {
            // Listen for language switch clicks
            document.addEventListener('click', (e) => {
                if (e.target.matches('[data-auth-type="language"]') || 
                    e.target.closest('[data-auth-type="language"]')) {
                    e.preventDefault();
                    this.switchLanguage();
                }
            });
        },
        
        // Switch between languages
        switchLanguage: function() {
            const newLanguage = this.currentLanguage === 'en' ? 'zh' : 'en';
            this.currentLanguage = newLanguage;
            this.applyLanguage(newLanguage);
            this.updateURL();
            
            // Dispatch custom event for other components
            document.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: newLanguage }
            }));
        },
        
        // Apply language to the page
        applyLanguage: function(language) {
            if (!this.translations || !this.translations[language]) {
                console.error('Translations not available for language:', language);
                return;
            }
            
            const t = this.translations[language];
            
            // Update page title
            document.title = t.pageTitle;
            
            // Update header content
            const headerTitle = document.querySelector('#header .content .inner h1');
            if (headerTitle) headerTitle.textContent = t.header.title;
            
            const headerSubtitle = document.querySelector('#header .content .inner p');
            if (headerSubtitle) {
                headerSubtitle.innerHTML = t.header.subtitle + '<br />' + t.header.subtitle2;
            }
            
            // Update main content
            const mainTitle = document.querySelector('h2.major');
            if (mainTitle) mainTitle.textContent = t.main.title;
            
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) subtitle.textContent = t.main.subtitle;
            
            // Update form elements
            this.updateFormElements(t.form);
            
            // Update legend items
            this.updateLegendItems(t.legend);
            
            // Update invitation button
            const invitationBtn = document.querySelector('.invitation-btn');
            if (invitationBtn) invitationBtn.textContent = t.invitation.button;
            
            // Update contact section
            this.updateContactSection(t.contact);
            
            // Update social media labels
            this.updateSocialLabels(t.social);
            
            // Update login page content if on login page
            this.updateLoginContent(t.login);
            
            // Update register page content if on register page
            this.updateRegisterContent(t.register);
            
            // Update navigation language button text
            this.updateNavigationLanguageButton(language);
        },
        
        // Update form elements
        updateFormElements: function(formTranslations) {
            // Update labels
            const labels = document.querySelectorAll('label');
            if (labels.length >= 4) {
                labels[0].textContent = formTranslations.name.label;
                labels[1].textContent = formTranslations.birthtime.label;
                labels[2].textContent = formTranslations.gender.label;
                labels[3].textContent = formTranslations.birthplace.label;
            }
            
            // Update placeholders
            const nameInput = document.getElementById('name');
            if (nameInput) nameInput.placeholder = formTranslations.name.placeholder;
            
            const birthtimeInput = document.getElementById('birthtime');
            if (birthtimeInput) birthtimeInput.placeholder = formTranslations.birthtime.placeholder;
            
            const birthplaceInput = document.getElementById('birthplace');
            if (birthplaceInput) birthplaceInput.placeholder = formTranslations.birthplace.placeholder;
            
            // Update gender select options
            const genderSelect = document.getElementById('gender');
            if (genderSelect) {
                genderSelect.innerHTML = `
                    <option value="">${formTranslations.gender.options.default}</option>
                    <option value="female">${formTranslations.gender.options.female}</option>
                    <option value="male">${formTranslations.gender.options.male}</option>
                `;
            }
            
            // Update submit button (only if not in calculating state)
            const submitBtn = document.querySelector('.btn-text');
            if (submitBtn && !submitBtn.classList.contains('calculating')) {
                submitBtn.textContent = formTranslations.submit;
            }
        },
        
        // Update legend items
        updateLegendItems: function(legendTranslations) {
            const legendItems = document.querySelectorAll('.legend-item span:not(.legend-color)');
            if (legendItems.length >= 3) {
                legendItems[0].textContent = legendTranslations.health;
                legendItems[1].textContent = legendTranslations.career;
                legendItems[2].textContent = legendTranslations.love;
            }
        },
        
        // Update contact section
        updateContactSection: function(contactTranslations) {
            const contactTitle = document.querySelector('.contact-title');
            if (contactTitle) contactTitle.textContent = contactTranslations.title;
            
            const contactMessageLabel = document.querySelector('label[for="contact-message"]');
            if (contactMessageLabel) contactMessageLabel.textContent = contactTranslations.message.label;
            
            const contactMessageInput = document.getElementById('contact-message');
            if (contactMessageInput) contactMessageInput.placeholder = contactTranslations.message.placeholder;
            
            const contactSubmitBtn = document.querySelector('ul.actions input[type="submit"]');
            if (contactSubmitBtn) contactSubmitBtn.value = contactTranslations.submit;
        },
        
        // Update social media labels
        updateSocialLabels: function(socialTranslations) {
            const socialLabels = document.querySelectorAll('.icons .label');
            if (socialLabels.length >= 4) {
                socialLabels[0].textContent = socialTranslations.twitter;
                socialLabels[1].textContent = socialTranslations.facebook;
                socialLabels[2].textContent = socialTranslations.instagram;
                socialLabels[3].textContent = socialTranslations.github;
            }
        },
        
        // Update navigation language button
        updateNavigationLanguageButton: function(language) {
            const langBtn = document.querySelector('[data-auth-type="language"]');
            if (langBtn) {
                langBtn.textContent = language === 'en' ? '中文' : 'ENG';
            }
        },
        
        // Update login page content
        updateLoginContent: function(loginTranslations) {
            if (!loginTranslations) return;
            
            // Update page title
            document.title = loginTranslations.title;
            
            // Update form content
            const loginTitle = document.getElementById('login-title');
            if (loginTitle) loginTitle.textContent = loginTranslations.loginTitle;
            
            const usernameLabel = document.getElementById('username-label');
            if (usernameLabel) usernameLabel.textContent = loginTranslations.usernameLabel;
            
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.placeholder = loginTranslations.usernamePlaceholder;
                usernameInput.title = loginTranslations.usernamePlaceholder;
            }
            
            const passwordLabel = document.getElementById('password-label');
            if (passwordLabel) passwordLabel.textContent = loginTranslations.passwordLabel;
            
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.placeholder = loginTranslations.passwordPlaceholder;
                passwordInput.title = loginTranslations.passwordPlaceholder;
            }
            
            const rememberLabel = document.getElementById('remember-label');
            if (rememberLabel) rememberLabel.textContent = loginTranslations.rememberLabel;
            
            const forgotPassword = document.getElementById('forgotPassword');
            if (forgotPassword) forgotPassword.textContent = loginTranslations.forgotPassword;
            
            const loginSubmit = document.getElementById('login-submit');
            if (loginSubmit) loginSubmit.textContent = loginTranslations.loginSubmit;
            
            const registerText = document.getElementById('register-text');
            if (registerText) registerText.textContent = loginTranslations.registerText;
            
            const registerLink = document.getElementById('register-link');
            if (registerLink) registerLink.textContent = loginTranslations.registerLink;
        },
        
        // Update register page content
        updateRegisterContent: function(registerTranslations) {
            if (!registerTranslations) return;
            
            // Update page title
            document.title = registerTranslations.title;
            
            // Update form content
            const registerTitle = document.getElementById('register-title');
            if (registerTitle) registerTitle.textContent = registerTranslations.registerTitle;
            
            const userNameLabel = document.getElementById('userName-label');
            if (userNameLabel) userNameLabel.textContent = registerTranslations.userNameLabel;
            
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.placeholder = registerTranslations.userNamePlaceholder;
                usernameInput.title = registerTranslations.userNamePlaceholder;
            }
            
            const userNameverificationLabel = document.getElementById('username-verification-label');
            if (userNameverificationLabel) userNameverificationLabel.textContent = registerTranslations.userNameverificationLabel;
            
            const usernameVerificationInput = document.getElementById('username-verification');
            if (usernameVerificationInput) {
                usernameVerificationInput.placeholder = registerTranslations.userNameverificationPlaceholder;
                usernameVerificationInput.title = registerTranslations.userNameverificationPlaceholder;
            }
            
            const emailLabel = document.getElementById('email-label');
            if (emailLabel) emailLabel.textContent = registerTranslations.emailLabel;
            
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.placeholder = registerTranslations.emailPlaceholder;
                emailInput.title = registerTranslations.emailPlaceholder;
            }
            
            const verificationLabel = document.getElementById('verification-label');
            if (verificationLabel) verificationLabel.textContent = registerTranslations.verificationLabel;
            
            const verificationInput = document.getElementById('verification');
            if (verificationInput) {
                verificationInput.placeholder = registerTranslations.verificationPlaceholder;
                verificationInput.title = registerTranslations.verificationPlaceholder;
            }
            
            const verificationResend = document.getElementById('verification-resend');
            if (verificationResend) verificationResend.textContent = registerTranslations.verificationResend;
            
            const passwordLabel = document.getElementById('password-label');
            if (passwordLabel) passwordLabel.textContent = registerTranslations.passwordLabel;
            
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.placeholder = registerTranslations.passwordPlaceholder;
                passwordInput.title = registerTranslations.passwordPlaceholder;
            }
            
            const confirmPasswordLabel = document.getElementById('confirm-password-label');
            if (confirmPasswordLabel) confirmPasswordLabel.textContent = registerTranslations.confirmPasswordLabel;
            
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.placeholder = registerTranslations.confirmPasswordPlaceholder;
                confirmPasswordInput.title = registerTranslations.confirmPasswordPlaceholder;
            }
            
            const passwordWarning = document.getElementById('password-warning');
            if (passwordWarning) passwordWarning.textContent = registerTranslations.passwordWarning;
            
            const agreeLabel = document.getElementById('agree-label');
            if (agreeLabel) agreeLabel.textContent = registerTranslations.agreeLabel;
            
            const termsLink = document.getElementById('termsLink');
            if (termsLink) termsLink.textContent = registerTranslations.termsLink;
            
            const registerSubmit = document.getElementById('register-submit');
            if (registerSubmit) registerSubmit.textContent = registerTranslations.registerSubmit;
            
            const verificationSubmit = document.getElementById('verification-submit');
            if (verificationSubmit) verificationSubmit.textContent = registerTranslations.verificationSubmit;
            
            const loginText = document.getElementById('login-text');
            if (loginText) loginText.textContent = registerTranslations.loginText;
            
            const loginLink = document.getElementById('login-link');
            if (loginLink) loginLink.textContent = registerTranslations.loginLink;
        },
        
        // Update URL to reflect current language
        updateURL: function() {
            const url = new URL(window.location);
            url.searchParams.set('lang', this.currentLanguage);
            window.history.replaceState({}, '', url);
        },
        
        // Get current language
        getCurrentLanguage: function() {
            return this.currentLanguage;
        },
        
        // Get translation for a specific key
        getTranslation: function(key) {
            if (!this.translations || !this.translations[this.currentLanguage]) {
                return key;
            }
            
            const keys = key.split('.');
            let value = this.translations[this.currentLanguage];
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return key;
                }
            }
            
            return value;
        },
        
        // Set submit button to calculating state
        setSubmitCalculating: function() {
            const submitBtn = document.querySelector('.btn-text');
            if (submitBtn) {
                submitBtn.classList.add('calculating');
                const calculatingText = this.getTranslation('form.submitCalculating');
                submitBtn.textContent = calculatingText;
            }
        },
        
        // Reset submit button to normal state
        resetSubmitButton: function() {
            const submitBtn = document.querySelector('.btn-text');
            if (submitBtn) {
                submitBtn.classList.remove('calculating');
                const normalText = this.getTranslation('form.submit');
                submitBtn.textContent = normalText;
            }
        }
    };

    // Initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            LanguageSwitcher.init();
        });
    } else {
        LanguageSwitcher.init();
    }

    // Make LanguageSwitcher globally available
    window.LanguageSwitcher = LanguageSwitcher;

})(); 