/* ============================================
   DARLA PRAVEEN — Portfolio Scripts
   Matrix rain, typing effect, scroll logic,
   Gorgeous 3D animations & interactive effects
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ───── Welcome Animation Overlay (Simplified) ─────
  (function welcomeAnimation() {
    const overlay = document.getElementById('welcomeOverlay');
    const welcomeWords = document.querySelectorAll('.welcome-word');
    const scrollHint = document.getElementById('scrollHint');

    if (!overlay || !welcomeWords.length) return;

    let animationStarted = false;

    function resetAnimation() {
      overlay.classList.remove('hidden');
      welcomeWords.forEach(word => {
        word.classList.remove('animate-in');
      });
      scrollHint.classList.remove('show');
    }

    function startAnimation() {
      if (animationStarted) return;
      animationStarted = true;
      resetAnimation();

      // Animate welcome words in quickly
      welcomeWords.forEach((word, index) => {
        setTimeout(() => word.classList.add('animate-in'), index * 60);
      });

      // Show scroll hint after 1 second
      setTimeout(() => {
        scrollHint.classList.add('show');
      }, 1000);

      // Hide overlay after 3 seconds total
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 3000);
    }

    // Matrix rain for welcome overlay
    const welcomeCanvas = document.getElementById('welcomeMatrixCanvas');
    if (welcomeCanvas) {
      const ctx = welcomeCanvas.getContext('2d');
      let W, H, columns, drops;
      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ';
      const fontSize = 14;
      let animationId;

      function initWelcomeMatrix() {
        W = welcomeCanvas.width = window.innerWidth;
        H = welcomeCanvas.height = window.innerHeight;
        columns = Math.floor(W / fontSize);
        drops = Array.from({ length: columns }, () => Math.random() * -100);
      }

      function drawWelcomeMatrix() {
        ctx.fillStyle = 'rgba(10, 14, 23, 0.05)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#00f0ff';
        ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

        for (let i = 0; i < columns; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          ctx.globalAlpha = Math.random() * 0.6 + 0.2;
          ctx.fillText(char, x, y);

          if (y > H && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        ctx.globalAlpha = 1;
        animationId = requestAnimationFrame(drawWelcomeMatrix);
      }

      initWelcomeMatrix();
      drawWelcomeMatrix();
      window.addEventListener('resize', initWelcomeMatrix);

      // Stop animation when overlay hides
      const observer = new MutationObserver(() => {
        if (overlay.classList.contains('hidden')) {
          cancelAnimationFrame(animationId);
        }
      });
      observer.observe(overlay, { attributes: true });
    }

    // Start animation on page load
    setTimeout(startAnimation, 300);
  })();

  // ───── Auto B.Tech Year Calculator (IST / Guntur time) ─────
  // Academic year increments every July 1st.
  // Schedule: 3rd Year → July 2026: 4th Year → July 2027+: Completed in 2028 • Kakinada
  (function updateBtechYear() {
    // Get current date in IST (UTC+5:30)
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 60 * 60000);
    const year = ist.getFullYear();
    const month = ist.getMonth(); // 0-indexed, July = 6

    // Base: Academic year starting July 2023 = hypothetical 1st year
    // July 2025–June 2026 = 3rd year, July 2026–June 2027 = 4th year
    const BASE_YEAR = 2023;
    const MAX_YEAR = 4;
    const GRAD_YEAR = 2028;
    const GRAD_LOCATION = 'Kakinada';

    let academicYear = month >= 6 ? (year - BASE_YEAR + 1) : (year - BASE_YEAR);
    const ordinal = (n) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th';

    const terminalYear = document.getElementById('terminalYear');
    const btechDetail = document.getElementById('btechDetail');
    const btechBadge = document.getElementById('btechBadge');
    const btechMarker = document.getElementById('btechMarker');
    const btechSub = document.getElementById('btechSub');

    if (academicYear > MAX_YEAR) {
      // Graduated
      if (terminalYear) terminalYear.textContent = 'Graduate';
      if (btechDetail) btechDetail.textContent = 'Completed in ' + GRAD_YEAR + ' \u2022 ' + GRAD_LOCATION;
      if (btechBadge) { btechBadge.textContent = 'Completed'; btechBadge.style.color = 'var(--neon-cyan)'; btechBadge.style.borderColor = 'rgba(0,240,255,.18)'; btechBadge.style.background = 'rgba(0,240,255,.08)'; }
      if (btechMarker) { btechMarker.classList.remove('current'); }
      if (btechSub) btechSub.textContent = 'B.Tech \u2022 CS (Cyber Security)';
    } else {
      // Still studying
      if (terminalYear) terminalYear.textContent = ordinal(academicYear);
      if (btechDetail) btechDetail.textContent = ordinal(academicYear) + ' Year \u2022 Undergraduate \u2022 Kakinada';
      if (btechBadge) btechBadge.textContent = 'Current';
    }
  })();

  // ───── Matrix Rain Canvas ─────
  const canvas = document.getElementById('matrixCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, columns, drops;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:<>?/~'.split('');
    const fontSize = 14;

    function initMatrix() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      columns = Math.floor(W / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    }

    function drawMatrix() {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.06)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00f0ff';
      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.globalAlpha = Math.random() * 0.4 + 0.1;
        ctx.fillText(char, x, y);

        if (y > H && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(drawMatrix);
    }

    initMatrix();
    drawMatrix();
    window.addEventListener('resize', initMatrix);
  }

  // ───── Typing Effect ─────
  const typedEl = document.getElementById('typedText');
  if (typedEl) {
    const phrases = [
      'Cybersecurity Engineer in Progress',
      'Robotics & ROS 2 Developer',
      'Secure Web Systems Builder',
      '3D Mapping & SLAM Researcher',
      'AI-Assisted Product Developer',
      'Linux & Network Security Practitioner'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    const typeSpeed = 70;
    const deleteSpeed = 40;
    const pauseEnd = 2000;
    const pauseStart = 500;

    function type() {
      const current = phrases[phraseIdx];
      if (!isDeleting) {
        typedEl.textContent = current.substring(0, charIdx + 1);
        charIdx++;
        if (charIdx === current.length) {
          isDeleting = true;
          setTimeout(type, pauseEnd);
          return;
        }
        setTimeout(type, typeSpeed);
      } else {
        typedEl.textContent = current.substring(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(type, pauseStart);
          return;
        }
        setTimeout(type, deleteSpeed);
      }
    }
    setTimeout(type, 1000);
  }

  // ───── Navbar: scroll styling ─────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ───── Navbar: mobile toggle ─────
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.classList.toggle('active');
  });
  // Close menu on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // ───── Active nav link on scroll ─────
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  function highlightNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinkEls.forEach(l => l.classList.remove('active'));
        const match = document.querySelector(`.nav-link[href="#${id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }
  window.addEventListener('scroll', highlightNav);

  // ──────────────────────────────────────────────
  // GORGEOUS ANIMATIONS
  // ──────────────────────────────────────────────

  // ───── Scroll Reveal: Slide-in Animations ─────
  // Elements with .slide-left, .slide-right, .slide-up get revealed on scroll
  // Other elements get the default .reveal treatment
  const slideEls = document.querySelectorAll('.slide-left, .slide-right, .slide-up');
  const revealEls = document.querySelectorAll(
    '.about-photo-card, .about-card, .contact-card, .social-links'
  );
  revealEls.forEach(el => {
    if (!el.classList.contains('slide-left') && !el.classList.contains('slide-right') && !el.classList.contains('slide-up')) {
      el.classList.add('reveal');
    }
  });

  const allAnimatedEls = document.querySelectorAll('.slide-left, .slide-right, .slide-up, .reveal');

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );
  allAnimatedEls.forEach(el => scrollObserver.observe(el));

  // ───── Staggered Slide Delays ─────
  // Project cards get staggered delays within their grid
  document.querySelectorAll('.projects-grid').forEach(grid => {
    grid.querySelectorAll('.project-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.15}s`;
    });
  });

  // ───── Gorgeous Button Ripple Effect ─────
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // ───── Project Card Mouse Glow Effect ─────
  document.querySelectorAll('.project-card').forEach(card => {
    const glow = card.querySelector('.project-glow');
    if (!glow) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty('--glow-x', `${x}%`);
      glow.style.setProperty('--glow-y', `${y}%`);
    });
  });

  // ───── Hero Parallax (Mouse Tracking) ─────
  const heroContent = document.querySelector('.hero-content');
  const hero = document.querySelector('.hero');

  if (hero && heroContent) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const heroTitle = heroContent.querySelector('.hero-title');
      const heroTag = heroContent.querySelector('.hero-tag');
      const heroSub = heroContent.querySelector('.hero-subtitle');
      const heroCta = heroContent.querySelector('.hero-cta');

      if (heroTitle) heroTitle.style.transform = `translate(${x * 20}px, ${y * 12}px)`;
      if (heroTag) heroTag.style.transform = `translate(${x * 10}px, ${y * 6}px)`;
      if (heroSub) heroSub.style.transform = `translate(${x * 14}px, ${y * 8}px)`;
      if (heroCta) heroCta.style.transform = `translate(${x * 6}px, ${y * 4}px)`;
    });

    hero.addEventListener('mouseleave', () => {
      const els = heroContent.querySelectorAll('.hero-title, .hero-tag, .hero-subtitle, .hero-cta');
      els.forEach(el => {
        el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 600);
      });
    });
  }

  // ───── Floating Particles (Ambient depth) ─────
  (function createParticles() {
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    Object.assign(container.style, {
      position: 'fixed', inset: '0', zIndex: '1',
      pointerEvents: 'none', overflow: 'hidden'
    });
    document.body.appendChild(container);

    const colors = [
      'rgba(0,240,255,.25)', 'rgba(57,255,20,.2)',
      'rgba(168,85,247,.18)', 'rgba(0,112,255,.2)'
    ];

    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const dur = Math.random() * 18 + 12;
      const delay = Math.random() * 12;
      Object.assign(p.style, {
        position: 'absolute',
        width: `${size}px`, height: `${size}px`,
        background: colors[Math.floor(Math.random() * colors.length)],
        borderRadius: '50%',
        left: `${Math.random() * 100}%`,
        opacity: '0',
        animation: `particleDrift ${dur}s ${delay}s ease-in-out infinite`
      });
      container.appendChild(p);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes particleDrift {
        0% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
        8% { opacity: 0.3; }
        50% { transform: translateY(40vh) translateX(30px) scale(1); }
        92% { opacity: 0.3; }
        100% { opacity: 0; transform: translateY(-10vh) translateX(0) scale(0.5); }
      }
    `;
    document.head.appendChild(style);
  })();

  // ──────────────────────────────────────────────
  // GORGEOUS GLOWING EFFECTS
  // ──────────────────────────────────────────────

  // ───── Global Cursor Glow Trail ─────
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  cursorGlow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursorGlow);

  let glowX = 0, glowY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    glowX = e.clientX;
    glowY = e.clientY;
  });

  function animateGlow() {
    // Smooth lerp for fluid trailing
    currentX += (glowX - currentX) * 0.08;
    currentY += (glowY - currentY) * 0.08;
    cursorGlow.style.left = `${currentX}px`;
    cursorGlow.style.top = `${currentY}px`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // Hide cursor glow on mobile
  if ('ontouchstart' in window) {
    cursorGlow.style.display = 'none';
  }

  // ───── About/Photo Card Mouse-Following Inner Glow ─────
  document.querySelectorAll('.about-card, .about-photo-card, .contact-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--card-glow-x', `${x}%`);
      card.style.setProperty('--card-glow-y', `${y}%`);
    });
  });

  // ───── Skill Items Mouse-Following Glow ─────
  document.querySelectorAll('.skill-item').forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      item.style.setProperty('--skill-glow-x', `${x}%`);
      item.style.setProperty('--skill-glow-y', `${y}%`);
    });
  });

  // ───── Gorgeous Button Particle Burst on Click ─────
  const burstColors = [
    '#00f0ff', '#39ff14', '#a855f7', '#0070ff',
    '#00f0ff', '#39ff14'
  ];

  document.querySelectorAll('.btn, .social-btn, .nav-link, .project-link').forEach(el => {
    el.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // Create 12 particles bursting outward
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('span');
        particle.className = 'btn-burst-particle';
        const angle = (Math.PI * 2 * i) / 12 + (Math.random() * 0.5 - 0.25);
        const distance = 40 + Math.random() * 60;
        const bx = Math.cos(angle) * distance;
        const by = Math.sin(angle) * distance;

        particle.style.left = `${cx}px`;
        particle.style.top = `${cy}px`;
        particle.style.setProperty('--burst-x', `${bx}px`);
        particle.style.setProperty('--burst-y', `${by}px`);
        particle.style.background = burstColors[Math.floor(Math.random() * burstColors.length)];
        particle.style.boxShadow = `0 0 6px ${particle.style.background}`;
        particle.style.width = `${Math.random() * 4 + 3}px`;
        particle.style.height = particle.style.width;

        this.style.position = this.style.position || 'relative';
        this.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove());
      }
    });
  });

  // ───── Nav Link Click Glow Flash ─────
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function () {
      this.style.textShadow = '0 0 20px rgba(0,240,255,.8), 0 0 40px rgba(0,240,255,.4)';
      setTimeout(() => {
        this.style.textShadow = '';
      }, 400);
    });
  });

  // ───── Project Card Hover Sound-like Glow Pulse ─────
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = `
        0 20px 50px rgba(0,0,0,.5),
        0 0 40px rgba(0,240,255,.12),
        0 0 80px rgba(0,240,255,.05),
        0 0 2px rgba(0,240,255,.5)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
    });
  });

  // ───── Robotics Video: compact preview -> animated modal player ─────
  const videoModal = document.getElementById('roboticsVideoModal');
  const modalVideo = document.getElementById('roboticsModalVideo');
  const videoTriggers = document.querySelectorAll('.project-video-trigger');
  let closeTimer = null;

  function openRoboticsVideo(src) {
    if (!videoModal || !modalVideo) return;
    const source = modalVideo.querySelector('source');
    if (source && src && source.getAttribute('src') !== src) {
      source.setAttribute('src', src);
      modalVideo.load();
    }
    clearTimeout(closeTimer);
    videoModal.classList.remove('is-closing');
    videoModal.classList.add('is-open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalVideo.controls = true;
    modalVideo.play().catch(() => {
      // Some mobile browsers block autoplay after UI animation.
      // The modal still opens with native controls so the user can tap Play.
    });
  }

  function closeRoboticsVideo() {
    if (!videoModal || !modalVideo || !videoModal.classList.contains('is-open')) return;
    modalVideo.pause();
    modalVideo.currentTime = 0;
    videoModal.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      videoModal.classList.remove('is-open', 'is-closing');
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }, 360);
  }

  videoTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => openRoboticsVideo(trigger.dataset.videoSrc));
  });

  document.querySelectorAll('[data-video-close]').forEach(closeEl => {
    closeEl.addEventListener('click', closeRoboticsVideo);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRoboticsVideo();
  });

  if (modalVideo) {
    modalVideo.addEventListener('ended', closeRoboticsVideo);
  }

});
