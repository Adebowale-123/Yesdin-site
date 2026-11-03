/* ==========================================================================
   Yesdin Technologies — script.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* -----------------------------------------------------------------------
       1. MOBILE RESPONSIVE HAMBURGER & DROPDOWN MANAGEMENT
    ----------------------------------------------------------------------- */
    const navToggle = document.getElementById('navToggle');
    const navMenu   = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navMenu.classList.toggle('mobile-open');
            navToggle.querySelector('i').className = isOpen ? 'fas fa-times' : 'fas fa-bars';
            if (!isOpen) {
                document.querySelectorAll('.dropdown.mobile-active')
                    .forEach(d => d.classList.remove('mobile-active'));
            }
        });
    }

    // Dropdown toggle on mobile tap
    document.querySelectorAll('.dropdown .dropdown-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                trigger.closest('.dropdown').classList.toggle('mobile-active');
            }
        });
    });

    // Close menu when clicking outside the header
    document.addEventListener('click', (e) => {
        if (navMenu && navMenu.classList.contains('mobile-open')) {
            if (!navMenu.contains(e.target) && navToggle && !navToggle.contains(e.target)) {
                navMenu.classList.remove('mobile-open');
                if (navToggle) navToggle.querySelector('i').className = 'fas fa-bars';
                document.querySelectorAll('.dropdown.mobile-active')
                    .forEach(d => d.classList.remove('mobile-active'));
            }
        }
    });


    /* -----------------------------------------------------------------------
       2. HERO SLIDER
    ----------------------------------------------------------------------- */
    const slides    = document.querySelectorAll('.slide');
    const dots      = document.querySelectorAll('.slider-dots .dot');
    const prevBtn   = document.querySelector('.prev-arrow');
    const nextBtn   = document.querySelector('.next-arrow');
    let currentSlide = 0;
    let sliderTimer;

    const goToSlide = (idx) => {
        if (!slides.length) return;
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        currentSlide = (idx + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    };

    const resetTimer = () => {
        clearInterval(sliderTimer);
        sliderTimer = setInterval(() => goToSlide(currentSlide + 1), 6000);
    };

    if (slides.length) {
        if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); resetTimer(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); resetTimer(); });
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => { goToSlide(i); resetTimer(); });
        });
        resetTimer();
    }


    /* -----------------------------------------------------------------------
       3. STICKY HEADER
    ----------------------------------------------------------------------- */
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                mainHeader.style.padding      = '5px 0';
                mainHeader.style.boxShadow    = '0 4px 20px rgba(0,0,0,0.1)';
                mainHeader.style.background   = 'rgba(255,255,255,0.98)';
            } else {
                mainHeader.style.padding      = '';
                mainHeader.style.boxShadow    = '0 2px 15px rgba(0,0,0,0.08)';
                mainHeader.style.background   = '#ffffff';
            }
        }, { passive: true });
    }


    /* -----------------------------------------------------------------------
       4. STATS COUNTER ANIMATION (IntersectionObserver)
    ----------------------------------------------------------------------- */
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (statNumbers.length) {
        const animateCount = (el) => {
            const target    = parseInt(el.dataset.target, 10);
            const duration  = 1800;
            const stepMs    = 16;
            const increment = target / (duration / stepMs);
            let current     = 0;
            const timer     = setInterval(() => {
                current += increment;
                if (current >= target) { el.textContent = target; clearInterval(timer); }
                else { el.textContent = Math.floor(current); }
            }, stepMs);
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = '1';
                    animateCount(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(n => statsObserver.observe(n));
    }


    /* -----------------------------------------------------------------------
       5. GALLERY / UPDATES FILTER
    ----------------------------------------------------------------------- */
    const filterBtns  = document.querySelectorAll('.filter-btn[data-filter]');
    const galleryCards = document.querySelectorAll('.gallery-card[data-category]');
    if (filterBtns.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.dataset.filter;
                galleryCards.forEach(card => {
                    card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
                });
            });
        });
    }


    /* -----------------------------------------------------------------------
       6. CONTACT FORM — FORMSPREE (sends directly to mailyesdin@gmail.com)
    ----------------------------------------------------------------------- */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const feedback   = document.getElementById('formFeedback');
        const submitBtn  = document.getElementById('submitBtn');
        const btnText    = submitBtn && submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn && submitBtn.querySelector('.btn-loading');

        const FORMSPREE_URL = 'https://formspree.io/f/mnjkpjgy';

        const showFeedback = (type, msg) => {
            if (!feedback) return;
            feedback.textContent   = msg;
            feedback.className     = 'form-feedback ' + type;
            feedback.style.display = 'block';
            feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        const setLoading = (loading) => {
            if (submitBtn)  submitBtn.disabled        = loading;
            if (btnText)    btnText.style.display     = loading ? 'none'        : 'inline-flex';
            if (btnLoading) btnLoading.style.display  = loading ? 'inline-flex' : 'none';
        };

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (feedback) feedback.style.display = 'none';

            const name    = contactForm.name.value.trim();
            const email   = contactForm.email.value.trim();
            const subject = contactForm.subject.value.trim();
            const message = contactForm.message.value.trim();

            // Client-side validation
            if (!name)    { showFeedback('error', 'Please enter your full name.');     return; }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showFeedback('error', 'Please enter a valid email address.');           return; }
            if (!subject) { showFeedback('error', 'Please enter a subject.');          return; }
            if (!message) { showFeedback('error', 'Please write your message.');       return; }

            setLoading(true);

            try {
                const res = await fetch(FORMSPREE_URL, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        phone:   (contactForm.phone   && contactForm.phone.value.trim())   || 'Not provided',
                        company: (contactForm.company && contactForm.company.value.trim()) || 'Not provided',
                        service: (contactForm.service && contactForm.service.value)        || 'Not specified',
                        subject,
                        message,
                        _replyto: email,
                        _subject: `New Contact: ${subject} — Yesdin Website`,
                    }),
                });

                const json = await res.json();

                if (res.ok) {
                    showFeedback('success', `✔ Message sent! We'll respond within 24 hours. Thank you, ${name}.`);
                    contactForm.reset();
                } else {
                    showFeedback('error', json.error || 'Submission failed. Please email admin@yesdin.ng directly.');
                }
            } catch (err) {
                showFeedback('error', 'Network error. Please check your connection and try again.');
            } finally {
                setLoading(false);
            }
        });
    }


    /* -----------------------------------------------------------------------
       7. BACK TO TOP BUTTON
    ----------------------------------------------------------------------- */
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    /* -----------------------------------------------------------------------
       8. SCROLL REVEAL FADE-IN
    ----------------------------------------------------------------------- */
    const revealTargets = document.querySelectorAll(
        '.service-teaser-card, .why-card, .competency-card, .step-card, ' +
        '.gallery-card, .video-card, .client-type-card, .future-card, ' +
        '.partner-card, .stat-card, .service-detail-card'
    );

    if (revealTargets.length && 'IntersectionObserver' in window) {
        const revealStyle = document.createElement('style');
        revealStyle.textContent = '.reveal{opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease}.reveal.in-view{opacity:1;transform:translateY(0)}';
        document.head.appendChild(revealStyle);

        revealTargets.forEach(el => el.classList.add('reveal'));

        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        revealTargets.forEach(el => revealObs.observe(el));
    }

}); // end DOMContentLoaded
