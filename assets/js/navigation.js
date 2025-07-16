/**
 * Enhanced Navigation System for HTML5 UP Template
 * Works with the shared navigation loader system
 */

(function($) {
    'use strict';

    // Navigation controller object
    var Navigation = {
        
        // Initialize the navigation system
        init: function() {
            // Wait for navigation to be loaded by the loader
            if (document.querySelector('.top-navigation')) {
                this.setupNavigation();
            } else {
                document.addEventListener('navigationLoaded', this.setupNavigation.bind(this));
            }
        },

        // Setup navigation after it's loaded
        setupNavigation: function() {
            this.removeDefaultHandlers();
            this.setupCustomNavigation();
            this.handleInitialLoad();
            this.handleEnergyPageReturn();
        },

        // Remove problematic default handlers from HTML5 UP template
        removeDefaultHandlers: function() {
            $('body').off('click');
            $(window).off('hashchange');
        },

        // Setup our custom navigation system
        setupCustomNavigation: function() {
            var self = this;
            
            // Handle navigation clicks
            $('nav a[href^="#"], .nav-item[href^="#"]').off('click').on('click', function(e) {
                self.handleNavClick.call(this, e);
            });
            
            // Handle close buttons
            $('#main article .close').off('click').on('click', function(e) {
                self.handleCloseClick(e);
            });
            
            // Handle body clicks (close when clicking outside)
            $('body').on('click', function(e) {
                self.handleBodyClick(e);
            });
            
            // Handle ESC key
            $(window).on('keyup', function(e) {
                self.handleKeyUp(e);
            });
        },

        // Navigate to a specific section
        navigateToSection: function(sectionId) {
            if (!sectionId || !$('#' + sectionId).length) return;
            
            // If we're already showing an article, switch directly
            if ($('body').hasClass('is-article-visible')) {
                // Hide current article
                $('#main article.active').removeClass('active').hide();
                // Show target article
                $('#' + sectionId).show().addClass('active');
            } else {
                // Show from homepage
                $('body').addClass('is-article-visible');
                $('#header').hide();
                $('#footer').hide();
                $('#main').show();
                $('#' + sectionId).show().addClass('active');
            }
            
            // Update navigation highlighting
            this.updateNavigationHighlight(sectionId);
            
            // Update URL
            history.replaceState(null, null, '#' + sectionId);
        },

        // Return to homepage
        returnToHome: function() {
            $('#main article').removeClass('active').hide();
            $('#main').hide();
            $('body').removeClass('is-article-visible');
            $('#header').show();
            $('#footer').show();
            
            // Clear navigation highlighting
            this.updateNavigationHighlight('');
            
            history.replaceState(null, null, '#');
        },

        // Update navigation highlighting based on current section
        updateNavigationHighlight: function(sectionId) {
            // Remove active class from all navigation items
            $('.nav-item').removeClass('active');
            
            // If we're on homepage, don't highlight anything
            if (!sectionId) return;
            
            // Map section IDs to navigation item data-nav-id
            const navItem = $(`.nav-item[data-nav-id="${sectionId}"]`);
            if (navItem.length) {
                navItem.addClass('active');
            }
        },

        // Handle navigation link clicks
        handleNavClick: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var href = $(this).attr('href');
            var navId = $(this).attr('data-nav-id');
            
            // Check if we're on login/register page
            var isLoginRegisterPage = window.location.pathname.includes('login.html') || 
                                    window.location.pathname.includes('register.html');
            
            if (!href || href === '#') {
                // Check if this is the energy curve navigation item
                if (navId === 'curve') {
                    // Navigate to energy curve page
                    var currentLanguage = window.NavigationConfig ? 
                        window.NavigationConfig.detectLanguage() : 'zh';
                    var curvePage = currentLanguage === 'zh' ? 
                        'curve/index_curve.html?lang=zh' : 
                        'curve/index_curve.html?lang=en';
                    window.location.href = curvePage;
                }
                return;
            }
            
            // If on login/register page, navigate to main page with section
            if (isLoginRegisterPage) {
                // Let the href handle the navigation (already set by loader)
                window.location.href = href;
                return;
            }
            
            var sectionId = href.substring(1);
            Navigation.navigateToSection(sectionId);
        },

        // Handle close button clicks
        handleCloseClick: function(e) {
            e.preventDefault();
            Navigation.returnToHome();
        },

        // Handle body clicks (close when clicking outside)
        handleBodyClick: function(e) {
            // Only hide if we're not clicking on navigation or inside an article
            if ($('body').hasClass('is-article-visible') && 
                !$(e.target).closest('#main article').length && 
                !$(e.target).closest('nav').length &&
                !$(e.target).hasClass('nav-item')) {
                
                Navigation.returnToHome();
            }
        },

        // Handle ESC key
        handleKeyUp: function(e) {
            if (e.keyCode === 27 && $('body').hasClass('is-article-visible')) {
                Navigation.returnToHome();
            }
        },

        // Handle initial page load with hash
        handleInitialLoad: function() {
            if (window.location.hash && window.location.hash !== '#') {
                var initialSection = window.location.hash.substring(1);
                var self = this;
                setTimeout(function() {
                    self.navigateToSection(initialSection);
                }, 100);
            } else {
                // If no hash, ensure no navigation items are highlighted
                this.updateNavigationHighlight('');
            }
        },

        // Handle return from energy curve page
        handleEnergyPageReturn: function() {
            if (sessionStorage.getItem('returnFromEnergy') === 'true') {
                sessionStorage.removeItem('returnFromEnergy');
                $('body').removeClass('is-preload');
            }
        }
    };

    // Initialize when document is ready
    $(document).ready(function() {
        Navigation.init();
    });

    // Energy curve page specific functionality
    if (window.location.pathname.includes('curve/')) {
        $(document).ready(function() {
            // Wait for navigation to be loaded
            function setupCurveNavigation() {
                const currentLanguage = window.NavigationConfig ? 
                    window.NavigationConfig.detectLanguage() : 'zh';
                const homePage = currentLanguage === 'en' ? '../index.html' : '../index-zh.html';
                
                // Setup navigation links to return to main page
                document.querySelectorAll('.nav-item').forEach(function(item, index) {
                    const navId = item.getAttribute('data-nav-id');
                    if (navId && navId !== 'curve') {
                        item.addEventListener('click', function(e) {
                            e.preventDefault();
                            sessionStorage.setItem('returnFromEnergy', 'true');
                            window.location.href = homePage + '#' + navId;
                        });
                    }
                });
                
                // Ensure energy curve navigation item stays highlighted
                const curveNavItem = document.querySelector('.nav-item[data-nav-id="curve"]');
                if (curveNavItem) {
                    curveNavItem.classList.add('active');
                }
                
                // Setup close button
                const closeBtn = document.querySelector('.close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        sessionStorage.setItem('returnFromEnergy', 'true');
                        window.location.href = homePage;
                    });
                }
                
                // Override goToHomePage for energy curve page
                window.goToHomePage = function() {
                    sessionStorage.setItem('returnFromEnergy', 'true');
                    window.location.href = homePage;
                };
            }

            // Wait for navigation to be loaded
            if (document.querySelector('.top-navigation')) {
                setupCurveNavigation();
            } else {
                document.addEventListener('navigationLoaded', setupCurveNavigation);
            }
        });
    }

    // Export for global access if needed
    window.Navigation = Navigation;

})(jQuery); 