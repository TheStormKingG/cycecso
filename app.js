/* CYCLE — deck controller
   No cookies, no tracking, no third-party scripts. The only network
   call is the visitor-initiated contact form insert. */

(function () {
  'use strict';

  /* Stamped here rather than inline in <head> so hide/reveal is atomic:
     if this file never loads, the deck degrades to a scrolling page. */
  document.documentElement.classList.add('js');

  var SUPABASE_URL = 'https://ilpnumlkhpjgadgdotwo.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Im5gVgF8p3CuN2S_4IdbxA_tPe23YMQ'; // publishable — safe to expose

  var slides   = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var pan      = document.getElementById('pan');
  var prevBtn  = document.getElementById('navPrev');
  var nextBtn  = document.getElementById('navNext');
  var dots     = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var counter  = document.getElementById('counter-now');
  var srLive   = document.getElementById('srLive');
  var ids      = slides.map(function (s) { return s.id; });
  var index    = 0;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Fade the panorama in once it has actually decoded ───────── */
  var probe = new Image();
  probe.onload = function () { pan.classList.add('is-ready'); };
  probe.onerror = function () { pan.classList.add('is-ready'); };
  probe.src = getComputedStyle(pan).backgroundImage.replace(/^.*url\(["']?/, '').replace(/["']?\).*$/, '');

  /* ── Shrink-to-fit: guarantees a slide never needs scrolling ─── */
  function fit(slide) {
    var inner = slide.querySelector('.slide-inner');
    if (!inner) return;
    inner.style.setProperty('--fit', '1');
    var cs = getComputedStyle(slide);
    var availH = slide.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var availW = slide.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var h = inner.scrollHeight;
    var w = inner.scrollWidth;
    if (h <= 0 || w <= 0) return;
    var scale = Math.min(1, availH / h, availW / w);
    /* Never shrink so far the text becomes unreadable — below this the
       responsive rules have already stripped the slide down. */
    scale = Math.max(scale, 0.55);
    inner.style.setProperty('--fit', String(Math.round(scale * 1000) / 1000));
    /* Re-centre the scaled box inside the available height. */
    var offset = Math.max(0, (availH - h * scale) / 2);
    inner.style.setProperty('--fit-y', Math.round(offset) + 'px');
  }

  function fitAll() { slides.forEach(fit); }

  /* ── Slide state ────────────────────────────────────────────── */
  function show(next, opts) {
    opts = opts || {};
    next = Math.max(0, Math.min(slides.length - 1, next));
    index = next;

    slides.forEach(function (s, i) {
      var on = i === index;
      s.classList.toggle('is-active', on);
      if (on) { s.removeAttribute('inert'); s.removeAttribute('aria-hidden'); }
      else    { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); }
    });

    dots.forEach(function (d, i) {
      d.classList.toggle('is-on', i === index);
      d.setAttribute('aria-current', i === index ? 'true' : 'false');
    });

    pan.style.setProperty('--i', String(index));
    counter.textContent = String(index + 1);
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;

    var label = slides[index].getAttribute('aria-label') || ('Slide ' + (index + 1));
    srLive.textContent = label;
    if (typeof cycleSpinFor === 'function') cycleSpinFor(ids[index]);

    if (!opts.silent) {
      var hash = '#' + ids[index];
      if (location.hash !== hash) {
        if (opts.replace) history.replaceState({ i: index }, '', hash);
        else history.pushState({ i: index }, '', hash);
      }
    }
    fit(slides[index]);
  }

  function go(delta) { show(index + delta); }

  /* ── Wiring ─────────────────────────────────────────────────── */
  slides.forEach(function (s) { s.removeAttribute('hidden'); });

  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });
  dots.forEach(function (d) {
    d.addEventListener('click', function () { show(Number(d.dataset.go)); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (e.key === 'ArrowRight' || (e.key === 'PageDown') || (e.key === ' ' && !typing)) {
      if (typing && e.key !== 'PageDown') return;
      e.preventDefault(); go(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (typing && e.key !== 'PageUp') return;
      e.preventDefault(); go(-1);
    } else if (e.key === 'Home') { e.preventDefault(); show(0); }
      else if (e.key === 'End')  { e.preventDefault(); show(slides.length - 1); }
  });

  /* Touch swipe */
  var tx = 0, ty = 0, tracking = false;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { tracking = false; return; }
    var t = e.target;
    if (t.closest && t.closest('input, textarea, button, a')) { tracking = false; return; }
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* Wheel / trackpad — the page can't scroll, so map it to the deck */
  var wheelLock = false;
  document.addEventListener('wheel', function (e) {
    if (e.target.closest && e.target.closest('textarea')) return;
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 24 || wheelLock) return;
    wheelLock = true;
    setTimeout(function () { wheelLock = false; }, 700);
    go(d > 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('popstate', function () {
    var i = ids.indexOf((location.hash || '').replace('#', ''));
    show(i < 0 ? 0 : i, { silent: true });
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(fitAll, 120);
  });
  window.addEventListener('orientationchange', function () { setTimeout(fitAll, 220); });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  window.addEventListener('load', fitAll);

  /* ── Boot ───────────────────────────────────────────────────── */
  var start = ids.indexOf((location.hash || '').replace('#', ''));
  fitAll();
  show(start < 0 ? 0 : start, { replace: true });

  /* ── Cycle diagram ──────────────────────────────────────────── */
  var cyBtns = Array.prototype.slice.call(document.querySelectorAll('[data-cy]'));
  var cyLis = Array.prototype.slice.call(document.querySelectorAll('.cy-l'));

  function cyReveal(i) {
    cyLis.forEach(function (li) {
      var rib = li.querySelector('.rib');
      var mine = rib && rib.dataset.cy === i;
      var descOpen = !li.querySelector('.cy-desc').hidden;
      li.classList.toggle('is-shown', mine || descOpen);
    });
  }

  function cySet(i, open) {
    var desc = document.getElementById('cyd-' + i);
    if (desc) desc.hidden = !open;
    cyBtns.forEach(function (b) {
      if (b.dataset.cy !== i) return;
      b.setAttribute('aria-expanded', String(open));
      b.classList.toggle('is-open', open);
    });
  }

  cyBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var i = b.dataset.cy;
      var open = b.getAttribute('aria-expanded') !== 'true';
      ['1', '2', '3', '4'].forEach(function (k) { cySet(k, k === i ? open : false); });
      cyReveal(i);
      fit(slides[index]);
    });
    /* Hovering or focusing a number reveals that step's title bar */
    if (b.classList.contains('cy-node')) {
      b.addEventListener('pointerenter', function () { cyReveal(b.dataset.cy); });
      b.addEventListener('focus', function () { cyReveal(b.dataset.cy); });
    }
  });

  /* ── Slow clockwise idle spin; hovering eases it to a stop with
        step 01 back at the top-left (WAAPI, numbers counter-rotate) ── */
  var fig = document.querySelector('.cycle-fig');
  var spinEl = document.getElementById('cy-spin');
  var nts = Array.prototype.slice.call(document.querySelectorAll('.cy-nt'));
  var SPIN_MS = 42000;
  var spinAnims = [];
  var canSpin = spinEl && 'animate' in spinEl && !reduced.matches &&
    window.matchMedia('(hover: hover)').matches &&
    window.matchMedia('(min-width: 901px) and (min-height: 601px)').matches;

  function angleOf(el) {
    var tr = getComputedStyle(el).transform;
    if (!tr || tr === 'none') return 0;
    var m = tr.match(/matrix\(([-\d.e]+),\s*([-\d.e]+)/);
    if (!m) return 0;
    var deg = Math.atan2(parseFloat(m[2]), parseFloat(m[1])) * 180 / Math.PI;
    return (deg % 360 + 360) % 360;
  }
  function cancelSpin() {
    spinAnims.forEach(function (a) { a.cancel(); });
    spinAnims = [];
  }
  function startSpin(fromDeg) {
    if (!canSpin) return;
    cancelSpin();
    var opts = { duration: SPIN_MS, iterations: Infinity };
    spinAnims = [spinEl.animate(
      [{ transform: 'rotate(' + fromDeg + 'deg)' }, { transform: 'rotate(' + (fromDeg + 360) + 'deg)' }], opts
    )].concat(nts.map(function (n) {
      return n.animate(
        [{ transform: 'rotate(' + (-fromDeg) + 'deg)' }, { transform: 'rotate(' + (-fromDeg - 360) + 'deg)' }], opts);
    }));
  }
  function easeToStop() {
    if (!canSpin || !spinAnims.length) return;
    var deg = angleOf(spinEl);
    cancelSpin();
    /* Glide a few more degrees and settle right there — no snapping
       back to a canonical pose. fill:'forwards' holds the resting
       angle until the pointer leaves and the idle spin resumes. */
    var glide = 9;
    var opts = { duration: 850, easing: 'cubic-bezier(.15, .6, .25, 1)', fill: 'forwards' };
    spinAnims = [spinEl.animate(
      [{ transform: 'rotate(' + deg + 'deg)' }, { transform: 'rotate(' + (deg + glide) + 'deg)' }], opts
    )].concat(nts.map(function (n) {
      return n.animate(
        [{ transform: 'rotate(' + (-deg) + 'deg)' }, { transform: 'rotate(' + (-deg - glide) + 'deg)' }], opts);
    }));
  }
  if (canSpin && fig) {
    fig.addEventListener('pointerenter', easeToStop);
    fig.addEventListener('pointerleave', function () { startSpin(angleOf(spinEl)); });
  }
  function cycleSpinFor(slideId) {
    if (!canSpin) return;
    if (slideId === 'model') { if (!spinAnims.length) startSpin(angleOf(spinEl)); }
    else cancelSpin();
  }
  cycleSpinFor(ids[index]); /* boot ran show() before this section existed */

  /* ── Team carousel: vertical, 3 visible, middle highlighted ──── */
  (function () {
    var vp = document.querySelector('.team-vp');
    var list = document.querySelector('.team-list');
    if (!vp || !list) return;
    var base = Array.prototype.slice.call(list.children);
    var N = base.length;
    if (N < 4) return;
    /* clone the first 3 so the wrap-around is seamless */
    base.slice(0, 3).forEach(function (it) { list.appendChild(it.cloneNode(true)); });
    var all = Array.prototype.slice.call(list.children);
    var ti = 0, timer = null;

    function rowH() {
      var gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      return base[0].getBoundingClientRect().height + gap;
    }
    function paint(instant) {
      list.style.transition = instant ? 'none' : 'transform .65s cubic-bezier(.25, .7, .25, 1)';
      list.style.transform = 'translateY(' + (-ti * rowH()) + 'px)';
      all.forEach(function (el, k) { el.classList.toggle('tm-mid', k === ti + 1); });
    }
    function step(dir) {
      if (dir > 0) {
        if (ti >= N) { ti = 0; paint(true); void list.offsetHeight; }
        ti++;
      } else {
        if (ti <= 0) { ti = N; paint(true); void list.offsetHeight; }
        ti--;
      }
      paint(false);
    }
    list.addEventListener('transitionend', function () {
      if (ti === N) { ti = 0; paint(true); }
    });
    function play() {
      if (timer || reduced.matches) return;
      timer = setInterval(function () { step(1); }, 3800);
    }
    function pause() { clearInterval(timer); timer = null; }

    vp.addEventListener('pointerenter', pause);
    vp.addEventListener('pointerleave', play);
    /* wheel scrubs the carousel instead of changing slides */
    vp.addEventListener('wheel', function (e) {
      e.stopPropagation(); e.preventDefault();
      if (Math.abs(e.deltaY) < 12) return;
      pause(); step(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    vp.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });

    window.addEventListener('resize', function () { paint(true); });
    paint(true);
    play();
  })();

  /* ── Contact form → Supabase (consent-gated, RLS-enforced) ──── */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = document.getElementById('form-status');
  var submitBtn = document.getElementById('cf-submit');

  function setStatus(kind, msg) {
    statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    statusEl.textContent = msg;
    fit(slides[index]);
  }

  function markInvalid(field) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', 'form-status');
    field.addEventListener('input', function clear() {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      field.removeEventListener('input', clear);
    });
    field.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');

    /* Honeypot: real visitors never see or fill this field. */
    if (form.website && form.website.value) {
      form.reset();
      setStatus('ok', 'Thank you — your message has been received.');
      return;
    }

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus('err', 'Please fill in your name, email, and message.');
      var empty = [form.name, form.email, form.message].filter(function (f) { return !f.value.trim(); })[0];
      if (empty) markInvalid(empty);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('err', 'That email address doesn’t look right — please check it.');
      markInvalid(form.email);
      return;
    }
    if (!form.consent.checked) {
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
      setStatus('ok', 'Thank you — we’ll reply to you by email.');
    }).catch(function () {
      setStatus('err', 'Could not send just now. Please email cyclegyinitiative@gmail.com.');
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    });
  });
})();
