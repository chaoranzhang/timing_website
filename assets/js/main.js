/*
	Dimension by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$header = $('#header'),
		$footer = $('#footer'),
		$main = $('#main'),
		$main_articles = $main.children('article');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ '361px',   '480px'  ],
			xxsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Fix: Flexbox min-height bug on IE.
		if (browser.name == 'ie') {

			var flexboxFixTimeoutId;

			$window.on('resize.flexbox-fix', function() {

				clearTimeout(flexboxFixTimeoutId);

				flexboxFixTimeoutId = setTimeout(function() {

					if ($wrapper.prop('scrollHeight') > $window.height())
						$wrapper.css('height', 'auto');
					else
						$wrapper.css('height', '100vh');

				}, 250);

			}).triggerHandler('resize.flexbox-fix');

		}

	// Nav.
		var $nav = $header.children('nav'),
			$nav_li = $nav.find('li');

		// Add "middle" alignment classes if we're dealing with an even number of items.
			if ($nav_li.length % 2 == 0) {

				$nav.addClass('use-middle');
				$nav_li.eq( ($nav_li.length / 2) ).addClass('is-middle');

			}

	// Main.
		var	delay = 325,
			locked = false;

		// Methods.
			$main._show = function(id, initial) {

				var $article = $main_articles.filter('#' + id);

				// No such article? Bail.
					if ($article.length == 0)
						return;

				// Handle lock.

					// Already locked? Speed through "show" steps w/o delays.
						if (locked || (typeof initial != 'undefined' && initial === true)) {

							// Mark as switching.
								$body.addClass('is-switching');

							// Mark as visible.
								$body.addClass('is-article-visible');

							// Deactivate all articles (just in case one's already active).
								$main_articles.removeClass('active');

							// Hide header, footer.
								$header.hide();
								$footer.hide();

							// Show main, article.
								$main.show();
								$article.show();

							// Activate article.
								$article.addClass('active');

							// Unlock.
								locked = false;

							// Unmark as switching.
								setTimeout(function() {
									$body.removeClass('is-switching');
								}, (initial ? 1000 : 0));

							return;

						}

					// Lock.
						locked = true;

				// Article already visible? Just swap articles.
					if ($body.hasClass('is-article-visible')) {

						// Deactivate current article.
							var $currentArticle = $main_articles.filter('.active');

							$currentArticle.removeClass('active');

						// Show article.
							setTimeout(function() {

								// Hide current article.
									$currentArticle.hide();

								// Show article.
									$article.show();

								// Activate article.
									setTimeout(function() {

										$article.addClass('active');

										// Window stuff.
											$window
												.scrollTop(0)
												.triggerHandler('resize.flexbox-fix');

										// Unlock.
											setTimeout(function() {
												locked = false;
											}, delay);

									}, 25);

							}, delay);

					}

				// Otherwise, handle as normal.
					else {

						// Mark as visible.
							$body
								.addClass('is-article-visible');

						// Show article.
							setTimeout(function() {

								// Hide header, footer.
									$header.hide();
									$footer.hide();

								// Show main, article.
									$main.show();
									$article.show();

								// Activate article.
									setTimeout(function() {

										$article.addClass('active');

										// Window stuff.
											$window
												.scrollTop(0)
												.triggerHandler('resize.flexbox-fix');

										// Unlock.
											setTimeout(function() {
												locked = false;
											}, delay);

									}, 25);

							}, delay);

					}

			};

			$main._hide = function(addState) {

				var $article = $main_articles.filter('.active');

				// Article not visible? Bail.
					if (!$body.hasClass('is-article-visible'))
						return;

				// Add state?
					if (typeof addState != 'undefined'
					&&	addState === true)
						history.pushState(null, null, '#');

				// Handle lock.

					// Already locked? Speed through "hide" steps w/o delays.
						if (locked) {

							// Mark as switching.
								$body.addClass('is-switching');

							// Deactivate article.
								$article.removeClass('active');

							// Hide article, main.
								$article.hide();
								$main.hide();

							// Show footer, header.
								$footer.show();
								$header.show();

							// Unmark as visible.
								$body.removeClass('is-article-visible');

							// Unlock.
								locked = false;

							// Unmark as switching.
								$body.removeClass('is-switching');

							// Window stuff.
								$window
									.scrollTop(0)
									.triggerHandler('resize.flexbox-fix');

							return;

						}

					// Lock.
						locked = true;

				// Deactivate article.
					$article.removeClass('active');

				// Hide article.
					setTimeout(function() {

						// Hide article, main.
							$article.hide();
							$main.hide();

						// Show footer, header.
							$footer.show();
							$header.show();

						// Unmark as visible.
							setTimeout(function() {

								$body.removeClass('is-article-visible');

								// Window stuff.
									$window
										.scrollTop(0)
										.triggerHandler('resize.flexbox-fix');

								// Unlock.
									setTimeout(function() {
										locked = false;
									}, delay);

							}, 25);

					}, delay);


			};

		// Articles.
			$main_articles.each(function() {

				var $this = $(this);

				// Close.
					$('<div class="close">Close</div>')
						.appendTo($this)
						.on('click', function() {
							location.hash = '';
						});

				// Prevent clicks from inside article from bubbling.
					$this.on('click', function(event) {
						event.stopPropagation();
					});

			});

		// Events.
			$body.on('click', function(event) {

				// Article visible? Hide.
					if ($body.hasClass('is-article-visible'))
						$main._hide(true);

			});

			$window.on('keyup', function(event) {

				switch (event.keyCode) {

					case 27:

						// Article visible? Hide.
							if ($body.hasClass('is-article-visible'))
								$main._hide(true);

						break;

					default:
						break;

				}

			});

			$window.on('hashchange', function(event) {

				// Empty hash?
					if (location.hash == ''
					||	location.hash == '#') {

						// Prevent default.
							event.preventDefault();
							event.stopPropagation();

						// Hide.
							$main._hide();

					}

				// Otherwise, check for a matching article.
					else if ($main_articles.filter(location.hash).length > 0) {

						// Prevent default.
							event.preventDefault();
							event.stopPropagation();

						// Show article.
							$main._show(location.hash.substr(1));

					}

			});

		// Scroll restoration.
		// This prevents the page from scrolling back to the top on a hashchange.
			if ('scrollRestoration' in history)
				history.scrollRestoration = 'manual';
			else {

				var	oldScrollPos = 0,
					scrollPos = 0,
					$htmlbody = $('html,body');

				$window
					.on('scroll', function() {

						oldScrollPos = scrollPos;
						scrollPos = $htmlbody.scrollTop();

					})
					.on('hashchange', function() {
						$window.scrollTop(oldScrollPos);
					});

			}

		// Initialize.

			// Hide main, articles.
				$main.hide();
				$main_articles.hide();

			// Initial article.
				if (location.hash != ''
				&&	location.hash != '#')
					$window.on('load', function() {
						$main._show(location.hash.substr(1), true);
					});

})(jQuery);

// FastAPI Server Validation Utils
// Contains utility functions for email verification, registration, and authentication
class ServerValidation {
    constructor() {
        this.API_BASE_URL = 'https://curve.sparkingtiming.com';
        // this.API_VERSION = '/v1';
		this.API_PORT = 9443
        this.TIMEOUT = 10000; // 10 seconds timeout
    }

    /**
     * Generic API request method
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - API response
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}:${this.API_PORT}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.TIMEOUT
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

			console.log("mergedOptions: ", mergedOptions);

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

    /**
     * Send verification code to email
     * Corresponds to FastAPI endpoint: POST /register/send_code
     * @param {string} email - User email address
     * @returns {Promise<Object>} - Response with message
     */
    async sendVerificationCode(username) {
        const requestData = {
            username: username
        };

        try {
            const response = await this.makeRequest('/auth/resend-verification-code', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            return {
                success: true,
                message: response.message || '验证码已发送',
                data: response
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || '发送验证码失败，请重试',
                error: error
            };
        }
    }

    /**
     * Register user with verification code
     * Corresponds to FastAPI endpoint: POST /register/submit
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - Registration response
     */
    async registerUser(userData) {
        const { username, email, password } = userData;

        // // Validate input data
        // const validation = this.validateRegistrationData(userData);
        // if (!validation.isValid) {
        //     throw new Error(validation.message);
        // }

        const requestData = {
            username: username,
            email: email,
            password: password,
        };

        try {
            const response = await this.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            return {
                success: true,
                message: response.message || '注册成功',
                data: response
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || '注册失败，请重试',
                error: error
            };
        }
    }


	async verifyUser(verifyData) {
        const { username, verificationCode} = verifyData;

        const requestData = {
            username: username,
            confirmation_code: verificationCode,
        };

        try {
			console.log("caole: ", requestData)
            const response = await this.makeRequest('/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            return {
                success: true,
                message: response.message || '注册成功',
                data: response
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || '注册失败，请重试',
                error: error
            };
        }
    }

    /**
     * User login
     * @param {Object} loginData - Login credentials
     * @returns {Promise<Object>} - Login response
     */
    async loginUser(loginData) {
        const { username, password, remember = false } = loginData;

        const requestData = {
            login_id: username,
            password: password,
            remember: remember
        };

        try {
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            return {
                success: true,
                message: response.message || '登录成功',
                access_token: response.access_token,
				token_type: response.token_type,
				username_token: response.username_token,
                user: username,
                data: response
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || '登录失败，请检查邮箱和密码',
                error: error
            };
        }
    }

	
	async userInfoUpdate(userInfoData) {
        const { birthtime, gender, birthplace } = userInfoData;

        const requestData = {
            dob: birthtime,
            sex: gender,
            birthplace: birthplace
        };

		const username_token = localStorage.getItem('username_token');


        try {
            const response = await this.makeRequest('/users/me', {
                method: 'PUT',
                body: JSON.stringify(requestData),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${username_token}`,
					'Accept': 'application/json',
				},
            });

			console.log("response: ", response);

            return {
                success: true,
                message: response.message || '登录成功',
                user: response.username,
                data: response
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || '登录失败，请检查邮箱和密码',
                error: error
            };
        }
    }

	

    /**
     * Validate email format
     * @param {string} email - Email address to validate
     * @returns {boolean} - True if email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate registration data
     * @param {Object} userData - User registration data
     * @returns {Object} - Validation result
     */
    validateRegistrationData(userData) {
        const { name, email, password} = userData;

        if (!name || name.trim().length === 0) {
            return { isValid: false, message: '请输入姓名' };
        }

        if (!email || !this.isValidEmail(email)) {
            return { isValid: false, message: '请输入有效的邮箱地址' };
        }

        if (!password || password.length < 6) {
            return { isValid: false, message: '密码长度至少6位' };
        }

        return { isValid: true, message: '验证通过' };
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
}

// Create global instance for server validation
window.serverValidation = new ServerValidation();

// Initialize server validation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Server Validation initialized');
    });
} else {
    console.log('Server Validation initialized');
}