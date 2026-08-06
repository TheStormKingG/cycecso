/* CYCLE — cycecso.com
   No cookies, no tracking, no third-party scripts.
   The only network call is the visitor-initiated contact form insert. */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://ilpnumlkhpjgadgdotwo.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Im5gVgF8p3CuN2S_4IdbxA_tPe23YMQ'; // publishable key — safe to expose

  /* ── Header shadow on scroll ── */
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile nav ── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  /* ── Reveal on scroll ── */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Footer year ── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── Contact form → Supabase (consent-gated, RLS-enforced) ── */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = document.getElementById('form-status');
  var submitBtn = document.getElementById('cf-submit');

  function setStatus(kind, msg) {
    statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    statusEl.textContent = msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');

    /* Honeypot: real visitors never see or fill this field. */
    if (form.website && form.website.value) {
      setStatus('ok', 'Thank you — your message has been received.');
      form.reset();
      return;
    }

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();
    var consent = form.consent.checked;

    if (!name || !email || !message) {
      setStatus('err', 'Please fill in your name, email, and message.');
      var firstEmpty = [form.name, form.email, form.message].find(function (f) { return !f.value.trim(); });
      if (firstEmpty) firstEmpty.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('err', 'That email address doesn’t look right — please check it.');
      form.email.focus();
      return;
    }
    if (!consent) {
      setStatus('err', 'Please tick the consent box so we’re allowed to store your message.');
      form.consent.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(SUPABASE_URL + '/rest/v1/cycle_messages', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ name: name, email: email, message: message, consent: true })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      setStatus('ok', 'Thank you — your message has been received. We’ll reply to you by email.');
    }).catch(function () {
      setStatus('err', 'Sorry, the message could not be sent right now. Please try again in a minute, or email us directly at cyclegyinitiative@gmail.com.');
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    });
  });
})();
