(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Header scroll state
     ------------------------------------------------------------------ */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
  }
  function openMenu() {
    mobileMenu.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden';
  }
  navToggle.addEventListener('click', function () {
    var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu(); else openMenu();
  });
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
  });

  /* ------------------------------------------------------------------
     Active nav link on scroll
     ------------------------------------------------------------------ */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          var match = link.getAttribute('href') === '#' + id;
          link.classList.toggle('is-active', match);
          if (match) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Portfolio carousel
     ------------------------------------------------------------------ */
  var track = document.getElementById('carouselTrack');
  if (track) {
    var slides = Array.prototype.slice.call(track.children);
    var dotsWrap = document.getElementById('carouselDots');
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    var status = document.getElementById('carouselStatus');
    var viewport = track.parentElement;
    var index = 0;
    var perView = 1;
    var autoplayId = null;
    var AUTOPLAY_MS = 5000;

    function getPerView() {
      var w = window.innerWidth;
      if (w >= 1000) return 3;
      if (w >= 640) return 2;
      return 1;
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView);
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      var count = maxIndex() + 1;
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.className = 'carousel__dot';
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Ir a la foto ' + (i + 1) + ' de ' + count);
        dot.addEventListener('click', function (i) {
          return function () { goTo(i, true); };
        }(i));
        dotsWrap.appendChild(dot);
      }
    }

    function update() {
      var slideWidth = viewport.clientWidth / perView;
      track.style.transform = 'translateX(' + (-index * slideWidth) + 'px)';
      var dots = dotsWrap.children;
      for (var i = 0; i < dots.length; i++) {
        var active = i === index;
        dots[i].classList.toggle('is-active', active);
        dots[i].setAttribute('aria-current', active ? 'true' : 'false');
      }
      status.textContent = 'Mostrando foto ' + (index + 1) + ' de ' + slides.length;
    }

    function goTo(i, userInitiated) {
      index = Math.min(Math.max(i, 0), maxIndex());
      update();
      if (userInitiated) restartAutoplay();
    }

    function next() { goTo(index + 1 > maxIndex() ? 0 : index + 1, true); }
    function prev() { goTo(index - 1 < 0 ? maxIndex() : index - 1, true); }

    function startAutoplay() {
      if (reduceMotion) return;
      stopAutoplay();
      autoplayId = window.setInterval(function () {
        goTo(index + 1 > maxIndex() ? 0 : index + 1, false);
      }, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayId) { window.clearInterval(autoplayId); autoplayId = null; }
    }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    var carouselRegion = document.querySelector('.carousel');
    carouselRegion.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { prev(); }
      if (e.key === 'ArrowRight') { next(); }
    });
    carouselRegion.addEventListener('mouseenter', stopAutoplay);
    carouselRegion.addEventListener('mouseleave', startAutoplay);
    carouselRegion.addEventListener('focusin', stopAutoplay);
    carouselRegion.addEventListener('focusout', startAutoplay);

    /* Touch swipe */
    var touchStartX = null;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      stopAutoplay();
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
      touchStartX = null;
      startAutoplay();
    }, { passive: true });

    function init() {
      perView = getPerView();
      buildDots();
      index = Math.min(index, maxIndex());
      update();
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var newPerView = getPerView();
        if (newPerView !== perView) { init(); }
        else { update(); }
      }, 150);
    });

    init();
    startAutoplay();
  }
})();
