// ===== ANIMATION CONTROLLER =====
class AnimationController {
    static init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        this.setupCounterAnimations();
    }
    
    static setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(entry.target);
                }
            });
        }, options);
        
        // Observe elements
        document.querySelectorAll('[class*="animate-"]').forEach(el => {
            observer.observe(el);
        });
    }
    
    static setupScrollAnimations() {
        const scrollElements = document.querySelectorAll('.scroll-animate');
        
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    
                    // Add specific animation based on data attribute
                    const animationType = entry.target.getAttribute('data-animation');
                    if (animationType) {
                        entry.target.classList.add(`animate-${animationType}`);
                    }
                }
            });
        });
        
        scrollElements.forEach(el => scrollObserver.observe(el));
    }
    
    static setupHoverAnimations() {
        // Hover lift effects
        document.querySelectorAll('.hover-lift').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'translateY(-8px)';
                el.style.boxShadow = 'var(--shadow-xl)';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '';
            });
        });
        
        // Hover scale effects
        document.querySelectorAll('.hover-scale').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.05)';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
            });
        });
        
        // Hover glow effects
        document.querySelectorAll('.hover-glow').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.boxShadow = 'var(--shadow-glow)';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.boxShadow = '';
            });
        });
    }
    
    static setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                }
            });
        });
        
        counters.forEach(counter => counterObserver.observe(counter));
    }
    
    static triggerAnimation(element) {
        const classes = element.className.split(' ');
        const animationClass = classes.find(cls => cls.startsWith('animate-'));
        
        if (animationClass) {
            element.style.animationPlayState = 'running';
        }
    }
    
    static animateCounter(element) {
        const target = element.textContent;
        const isPercentage = target.includes('%');
        const isStar = target.includes('★');
        const isNumber = target.includes('K+');
        
        let finalValue;
        if (isPercentage) {
            finalValue = parseInt(target);
        } else if (isNumber) {
            finalValue = parseInt(target);
        } else if (isStar) {
            finalValue = parseFloat(target);
        } else {
            return;
        }
        
        let current = 0;
        const increment = finalValue / 60; // 60 frames for smooth animation
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= finalValue) {
                current = finalValue;
                clearInterval(timer);
            }
            
            if (isPercentage) {
                element.textContent = Math.floor(current) + '%';
            } else if (isNumber) {
                element.textContent = Math.floor(current) + 'K+';
            } else if (isStar) {
                element.textContent = current.toFixed(1) + '★';
            }
        }, 16); // ~60fps
    }
    
    static addRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    static typeWriter(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
    }
    
    static morphShape(element) {
        element.classList.add('animate-morphShape');
    }
    
    static parallaxScroll() {
        const parallaxElements = document.querySelectorAll('.parallax');
        const scrollTop = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const speed = el.getAttribute('data-speed') || 0.5;
            const yPos = -(scrollTop * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }
}

// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(container, options = {}) {
        this.container = container;
        this.particles = [];
        this.options = {
            count: options.count || 50,
            color: options.color || '#667eea',
            size: options.size || 2,
            speed: options.speed || 1,
            opacity: options.opacity || 0.6
        };
        
        this.init();
    }
    
    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        
        for (let i = 0; i < this.options.count; i++) {
            this.createParticle();
        }
        
        this.animate();
    }
    
    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${this.options.size}px;
            height: ${this.options.size}px;
            background: ${this.options.color};
            border-radius: 50%;
            opacity: ${this.options.opacity};
            pointer-events: none;
        `;
        
        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }
    
    animate() {
        this.particles.forEach(particle => {
            particle.style.animation = 'particleFloat 15s linear infinite';
        });
    }
}

// ===== LOADING ANIMATIONS =====
class LoadingAnimations {
    static createSpinner(size = 40, color = '#667eea') {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border: 4px solid rgba(102, 126, 234, 0.2);
            border-top: 4px solid ${color};
            border-radius: 50%;
            animation: rotate 1s linear infinite;
        `;
        return spinner;
    }
    
    static createDots(count = 3, color = '#667eea') {
        const container = document.createElement('div');
        container.className = 'loading-dots';
        container.style.cssText = `
            display: flex;
            gap: 4px;
            align-items: center;
        `;
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'loading-dot';
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                background: ${color};
                border-radius: 50%;
                animation: bounce 1.4s ease-in-out infinite both;
                animation-delay: ${i * 0.16}s;
            `;
            container.appendChild(dot);
        }
        
        return container;
    }
    
    static createWave(bars = 5, color = '#667eea') {
        const container = document.createElement('div');
        container.className = 'loading-wave';
        container.style.cssText = `
            display: flex;
            gap: 2px;
            align-items: end;
        `;
        
        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');
            bar.className = 'loading-bar';
            bar.style.cssText = `
                width: 4px;
                height: 20px;
                background: ${color};
                border-radius: 2px;
                animation: bounce 1.2s ease-in-out infinite;
                animation-delay: ${i * 0.1}s;
            `;
            container.appendChild(bar);
        }
        
        return container;
    }
}

// ===== TRANSITION EFFECTS =====
class TransitionEffects {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }
    
    static slideIn(element, direction = 'up', duration = 300) {
        const transforms = {
            up: 'translateY(100%)',
            down: 'translateY(-100%)',
            left: 'translateX(100%)',
            right: 'translateX(-100%)'
        };
        
        element.style.transform = transforms[direction];
        element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'translate(0)';
        });
    }
    
    static scaleIn(element, duration = 300) {
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
        });
    }
    
    static flipIn(element, axis = 'Y', duration = 600) {
        element.style.transform = `rotate${axis}(90deg)`;
        element.style.transition = `transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.transform = `rotate${axis}(0deg)`;
        });
    }
}

// ===== SCROLL EFFECTS =====
class ScrollEffects {
    static parallax(elements) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            
            elements.forEach(el => {
                const speed = el.getAttribute('data-speed') || 0.5;
                const yPos = -(scrollTop * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }
    
    static reveal(elements) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });
        
        elements.forEach(el => observer.observe(el));
    }
    
    static counter(elements) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    AnimationController.animateCounter(entry.target);
                }
            });
        });
        
        elements.forEach(el => observer.observe(el));
    }
}

// ===== INITIALIZE ANIMATIONS =====
document.addEventListener('DOMContentLoaded', () => {
    AnimationController.init();
    
    // Add ripple effect to buttons
    document.querySelectorAll('.btn-premium, .btn-hero-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            AnimationController.addRippleEffect(btn, e);
        });
    });
    
    // Add parallax scrolling
    window.addEventListener('scroll', AnimationController.parallaxScroll);
    
    // Initialize particle systems
    const particleContainers = document.querySelectorAll('.particle-system');
    particleContainers.forEach(container => {
        new ParticleSystem(container);
    });
    
    // Add scroll reveal animations
    const scrollElements = document.querySelectorAll('.scroll-animate');
    ScrollEffects.reveal(scrollElements);
    
    // Add counter animations
    const counterElements = document.querySelectorAll('.stat-number');
    ScrollEffects.counter(counterElements);
});

// ===== EXPORT CLASSES =====
window.AnimationController = AnimationController;
window.ParticleSystem = ParticleSystem;
window.LoadingAnimations = LoadingAnimations;
window.TransitionEffects = TransitionEffects;
window.ScrollEffects = ScrollEffects;
