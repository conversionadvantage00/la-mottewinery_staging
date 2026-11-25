/* La Motte microsite — interactions (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smooth scroll (Lenis, as on la-motte.com) ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({
      autoRaf: true,
      anchors: true /* header offset comes from scroll-padding-top in the CSS */
    });
    window.lenis = lenis;
  }
  function lockScroll(on) {
    document.body.classList.toggle('is-locked', on);
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
  }

  /* Gentle parallax on the hero image and the film as they scroll past */
  var heroImg = $('.hero img'), film = $('.film'), filmVideo = film && $('video', film);
  function parallax() {
    var y = window.scrollY, vh = window.innerHeight;
    if (heroImg && y < vh * 1.2) heroImg.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0) scale(' + (1 + y / vh * 0.06).toFixed(4) + ')';
    if (filmVideo) {
      var r = film.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        filmVideo.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0) scale(1.14)';
      }
    }
  }
  if (!reduce) {
    if (lenis) lenis.on('scroll', parallax);
    else window.addEventListener('scroll', function () { window.requestAnimationFrame(parallax); }, { passive: true });
    parallax();
  }

  /* ---------- Header ---------- */
  var top = $('.top');
  var onScroll = function () { top.classList.toggle('is-stuck', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var burger = $('.top__burger');
  var menu = $('#menu');
  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    lockScroll(open);
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) setMenu(false); });

  /* Current section in the nav */
  var navLinks = $$('.top__nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) spy.observe(t); });

  }

  /* Reveal — anything at or above the fold is shown, so anchor jumps never leave content hidden */
  var pending = $$('.reveal'), ticking = false;
  function reveal() {
    ticking = false;
    var limit = window.innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
  }
  window.addEventListener('scroll', function () { if (!ticking && pending.length) { ticking = true; window.requestAnimationFrame(reveal); } }, { passive: true });
  window.addEventListener('resize', reveal);
  window.addEventListener('load', reveal);
  reveal();

  /* ---------- Rails ---------- */
  $$('[data-rail]').forEach(function (rail) {
    var track = $('.rail__track', rail);
    var prev = $('[data-prev]', rail), next = $('[data-next]', rail);
    var bar = $('.rail__progress span', rail), count = $('.rail__count', rail);
    var items = track.children;
    function step() {
      var first = items[0];
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var per = Math.max(1, Math.floor(track.clientWidth / (first.offsetWidth + gap)));
      return (first.offsetWidth + gap) * Math.max(1, per - (per > 2 ? 1 : 0));
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      rail.classList.toggle('is-static', max < 8);
      var p = max > 0 ? track.scrollLeft / max : 0;
      var w = Math.max(8, Math.min(100, (track.clientWidth / track.scrollWidth) * 100));
      bar.style.width = w + '%';
      bar.style.left = (p * (100 - w)) + '%';
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > max - 4;
      if (count) {
        var edge = track.getBoundingClientRect().right + 1, seen = 0;
        for (var i = 0; i < items.length; i++) { if (items[i].getBoundingClientRect().right <= edge + items[i].offsetWidth * 0.5) seen = i + 1; }
        count.textContent = seen + ' / ' + items.length;
      }
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    $$('img', track).forEach(function (img) { if (!img.complete) img.addEventListener('load', update, { once: true }); });
    update();
  });

  /* ---------- Focus trapping helper ---------- */
  var lastFocus = null;
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Detail drawer ---------- */
  var drawer = $('#drawer'), drawerContent = $('.drawer__content', drawer);
  function openDrawer(card) {
    var tpl = $('template', card);
    if (!tpl) return;
    lastFocus = document.activeElement;
    drawerContent.innerHTML = '';
    drawerContent.appendChild(tpl.content.cloneNode(true));
    var title = $('.detail__title', drawerContent);
    if (title) title.id = 'drawer-title';
    if (card.classList.contains('card--art')) $('.detail__media', drawerContent).classList.add('is-contain');
    $$('img', drawerContent).forEach(function (img) { img.loading = 'eager'; });
    drawer.hidden = false;
    lockScroll(true);
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    $('.drawer__close', drawer).focus();
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.classList.remove('is-open');
    lockScroll(false);
    window.setTimeout(function () { drawer.hidden = true; drawerContent.innerHTML = ''; }, reduce ? 0 : 450);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) { openDrawer(opener.closest('.card')); return; }
    if (e.target.closest('#drawer [data-close]')) closeDrawer();
  });
  drawer.addEventListener('keydown', function (e) { trap(drawer, e); });

  /* ---------- Gallery lightbox ---------- */
  var box = $('#lightbox'), boxImg = $('img', box), boxCount = $('.lightbox__count', box);
  var shots = $$('[data-zoom]'), current = 0;
  function show(i) {
    current = (i + shots.length) % shots.length;
    boxImg.src = shots[current].getAttribute('data-zoom');
    boxImg.alt = $('img', shots[current]).alt;
    boxCount.textContent = (current + 1) + ' / ' + shots.length;
  }
  function openBox(i) { lastFocus = document.activeElement; box.hidden = false; lockScroll(true); show(i); $('.lightbox__close', box).focus(); }
  function closeBox() { if (box.hidden) return; box.hidden = true; lockScroll(false); if (lastFocus) lastFocus.focus(); }
  shots.forEach(function (b, i) { b.addEventListener('click', function () { openBox(i); }); });
  box.addEventListener('click', function (e) {
    if (e.target.closest('[data-prev]')) show(current - 1);
    else if (e.target.closest('[data-next]')) show(current + 1);
    else if (e.target.closest('[data-close]') || e.target === box) closeBox();
  });
  box.addEventListener('keydown', function (e) { trap(box, e); });
  var touchX = null;
  box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); closeBox(); if (!menu.hidden) setMenu(false); }
    if (!box.hidden && e.key === 'ArrowLeft') show(current - 1);
    if (!box.hidden && e.key === 'ArrowRight') show(current + 1);
  });

  /* ---------- Contact form (same CA Microsites endpoint and form as before) ---------- */
  var form = $('#contact-form');
  if (form) {
    var alertEl = $('.form__alert', form), submit = $('button[type="submit"]', form);
    var widgetId = null;
    window.__lmRecaptcha = function () {
      if (window.grecaptcha && widgetId === null) widgetId = window.grecaptcha.render('recaptcha', { sitekey: form.dataset.sitekey });
    };
    var loadCaptcha = function () {
      if (document.getElementById('recaptcha-js')) return;
      var s = document.createElement('script');
      s.id = 'recaptcha-js';
      s.src = 'https://www.google.com/recaptcha/api.js?onload=__lmRecaptcha&render=explicit';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      var fo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { loadCaptcha(); fo.disconnect(); } }, { rootMargin: '600px' });
      fo.observe(form);
    } else { loadCaptcha(); }

    var say = function (msg, isError) { alertEl.textContent = msg; alertEl.classList.toggle('is-error', !!isError); };
    var validate = function () {
      var ok = true;
      $$('.field__error', form).forEach(function (n) { n.remove(); });
      $$('[required]', form).forEach(function (el) {
        var field = el.closest('.field'), msg = '';
        if (!el.value.trim()) msg = 'This field is required.';
        else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) msg = 'Please enter a valid e-mail address.';
        field.classList.toggle('is-invalid', !!msg);
        el.setAttribute('aria-invalid', String(!!msg));
        if (msg) { ok = false; var p = document.createElement('p'); p.className = 'field__error'; p.textContent = msg; field.appendChild(p); }
      });
      if (!ok) { var bad = $('.is-invalid input, .is-invalid select', form); if (bad) bad.focus(); }
      return ok;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      say('');
      if (!validate()) return;
      var data = new FormData(form);
      if (window.grecaptcha && widgetId !== null && !window.grecaptcha.getResponse(widgetId)) { say('Please complete the reCAPTCHA.', true); return; }
      data.append('form_code', form.dataset.formCode);
      var label = submit.textContent;
      submit.disabled = true; submit.textContent = 'Submitting...';
      fetch(form.dataset.endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'Something went wrong. Please try again.'); return j; }); })
        .then(function () {
          say('Your request has been completed Successfully.');
          form.reset();
          if (window.grecaptcha && widgetId !== null) window.grecaptcha.reset(widgetId);
        })
        .catch(function (err) { say(err.message || 'Something went wrong. Please try again.', true); })
        .then(function () { submit.disabled = false; submit.textContent = label; });
    });
  }
})();
