(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav fija + barra de progreso
  var nav = document.getElementById('topNav');
  var bar = document.getElementById('progressBar');
  function onScroll() {
    if (window.scrollY > 40) { nav.classList.add('nav-scrolled'); }
    else { nav.classList.remove('nav-scrolled'); }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Vídeo del hero: sin autoplay con reduced motion, y en pausa fuera de pantalla
  var heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    if (reduced) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { heroVideo.play().catch(function () {}); }
          else { heroVideo.pause(); }
        });
      }, { threshold: 0.05 }).observe(heroVideo);
    }
  }

  // Rotador de oferta
  var rotWord = document.getElementById('rotWord');
  if (rotWord && !reduced) {
    var words = ['webs novedosas', 'automatizaciones IA', 'software para el día a día', 'Shiftia'];
    var wi = 0;
    setInterval(function () {
      rotWord.classList.add('out');
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        rotWord.textContent = words[wi];
        rotWord.classList.remove('out');
      }, 360);
    }, 2600);
  }

  // Glow que sigue al cursor en el hero
  var hero = document.getElementById('hero');
  var glow = document.getElementById('heroGlow');
  if (hero && glow && !reduced && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.left = (e.clientX - r.left) + 'px';
      glow.style.top = (e.clientY - r.top) + 'px';
      glow.style.opacity = '1';
    });
    hero.addEventListener('mouseleave', function () { glow.style.opacity = '0'; });
  }

  // Contadores animados (banda de métricas)
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduced || !isFinite(target)) { el.textContent = String(target); return; }
    var start = null;
    function step(ts) {
      if (!start) { start = ts; }
      var p = Math.min((ts - start) / 1200, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(eased * target));
      if (p < 1) { requestAnimationFrame(step); }
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCount(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Menú móvil accesible: Escape, bloqueo de scroll y gestión de foco
  var menuBtn = document.getElementById('menuBtn');
  var closeBtn = document.getElementById('closeBtn');
  var menu = document.getElementById('mobileMenu');
  function openMenu() {
    menu.classList.remove('hidden');
    menu.classList.add('flex');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeMenu() {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    menuBtn.focus();
  }
  if (menuBtn && menu && closeBtn) {
    menuBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) { closeMenu(); }
    });
  }

  // Reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // Tilt 3D en el mockup de webs (solo puntero fino y sin reduced motion)
  var canTilt = window.matchMedia('(pointer: fine)').matches && !reduced;
  if (canTilt) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var inner = card.querySelector('.tilt-inner');
      if (!inner) { return; }
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        inner.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  // Formulario: redirección de vuelta con ?enviado=1/0 y avisos
  var form = document.getElementById('contactForm');
  if (form) {
    var next = form.querySelector('input[name="_next"]');
    if (next) { next.value = location.origin + location.pathname + '?enviado=1'; }
    // Si la API propia está configurada (Resend), el formulario la usa y llegan
    // las plantillas de marca; si no, sigue en FormSubmit sin romperse.
    fetch('/api/health')
      .then(function (r) { return r.json(); })
      .then(function (h) { if (h && h.ready) { form.setAttribute('action', '/api/contact'); } })
      .catch(function () {});
  }
  var enviado = new URLSearchParams(location.search).get('enviado');
  if (enviado === '1' || enviado === '0') {
    var banner = document.getElementById(enviado === '1' ? 'formOk' : 'formErr');
    if (banner) {
      banner.classList.remove('hidden');
      document.getElementById('contacto').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
    history.replaceState(null, '', location.pathname);
  }

  // Año dinámico
  var year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }
})();
