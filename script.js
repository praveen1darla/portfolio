/* ============================================
   DARLA PRAVEEN — Portfolio Scripts
   Matrix rain, typing effect, scroll logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

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
      'Cybersecurity Student',
      'Ethical Hacking Enthusiast',
      'Security Research Learner',
      'Penetration Testing Explorer',
      '3D Mapping & Robotics Researcher',
      'Linux & Network Security'
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

  // ───── Scroll Reveal ─────
  const revealEls = document.querySelectorAll(
    '.about-photo-card, .about-card, .project-card, .contact-card, .social-links, .section-title, .section-desc'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach(el => observer.observe(el));

  // ───── Staggered reveal for project cards ─────
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });

});
