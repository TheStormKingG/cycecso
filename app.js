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

  /* ── Wrap each slide's post-headline content in .slide-body ──── */
  /* Runs once, before the first fit(): gives every slide's eyebrow
     and headline a stable, unscaled "page header" and lets fit()
     shrink only what comes after — see the .slide-body comment in
     styles.css for why. */
  slides.forEach(function (s) {
    var inner = s.querySelector('.slide-inner');
    var headline = inner && inner.querySelector('.headline');
    if (!inner || !headline) return;
    var body = document.createElement('div');
    body.className = 'slide-body';
    var node = headline.nextElementSibling;
    var toMove = [];
    while (node) { toMove.push(node); node = node.nextElementSibling; }
    headline.parentNode.insertBefore(body, headline.nextSibling);
    toMove.forEach(function (n) { body.appendChild(n); });
  });
  /* Force a synchronous style flush before anything below adds the
     .is-active class that starts the entrance "rise" animation.
     Without it, the DOM move above and that class change can land in
     the same style-recalc batch, and the animation can fail to
     register its "backwards"-fill starting state as a real transition
     — it was observed getting stuck permanently mid-animation
     (translateY(14px), never settling to 0) on whichever slide the
     page booted directly into via URL hash. */
  void document.body.offsetHeight;

  /* ── Shrink-to-fit: guarantees a slide never needs scrolling ─── */
  function fit(slide) {
    var inner = slide.querySelector('.slide-inner');
    var body = slide.querySelector('.slide-body');
    if (!inner || !body) return;
    body.style.width = '';
    body.style.setProperty('--body-fit', '1');
    var cs = getComputedStyle(slide);
    var availH = slide.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    /* .slide-inner itself is never scaled — only .slide-body is — so
       body.offsetTop (its offsetParent is slide-inner, made reliable
       by slide-inner's position:relative) is exactly how much vertical
       space the eyebrow+headline "page header" naturally consumes,
       with no manual height-summing needed. That header always renders
       at its plain CSS size, so it looks identical on every slide
       regardless of how much any one slide's BODY needs to shrink. */
    var headerH = body.offsetTop;
    var availBodyH = availH - headerH;
    /* The width the body should END UP occupying: slide-inner's own
       content width, i.e. exactly what it would fill if it never
       needed to shrink at all. */
    var targetW = inner.clientWidth;
    if (availBodyH <= 0 || targetW <= 0) return;

    /* Give the body a layout width of targetW/scale so that, once the
       ambient scale is applied, it renders back at the full targetW.
       Without this the body keeps its natural width, scales down about
       its top-left corner, and ends up occupying only `scale` of the
       available width — every slide that had to shrink was rendering
       its content crammed into the left of the screen with dead space
       down the right. Widening first means the shrink now only makes
       the TYPE smaller, never the column narrower.

       It has to iterate: a wider box re-wraps the text, which changes
       the height, which changes the scale, which changes the width.
       It converges quickly (each round moves less than the last), so
       a few rounds plus a tolerance is enough.

       Solved by BISECTION rather than by feeding each result back in
       as the next guess. That obvious fixed-point loop oscillates
       whenever the fit is marginal — height responds sharply to width,
       so a guess that just fails jumps to one that comfortably fits
       and back again, and the loop then returns whichever end of the
       swing it happened to stop on. It cost slide 1 a real ~24% of its
       size (settling at 0.759 while reporting a body that fit inside
       its slot with room to spare). Rendered height grows monotonically
       with scale — a bigger scale means a narrower box, more wrapped
       lines AND less shrink — so "does this scale fit?" flips exactly
       once across the range, which is all bisection needs. */
    function heightAt(s) {
      body.style.width = (targetW / s) + 'px';
      return body.scrollHeight;
    }
    function fitsAt(s) {
      var hh = heightAt(s);
      return hh > 0 && hh * s <= availBodyH + 1;
    }
    function solve(minScale) {
      if (fitsAt(1)) { heightAt(1); return 1; }
      if (!fitsAt(minScale)) { heightAt(minScale); return minScale; }
      var lo = minScale, hi = 1;
      for (var i = 0; i < 7; i++) {
        var mid = (lo + hi) / 2;
        if (fitsAt(mid)) lo = mid; else hi = mid;
      }
      heightAt(lo);
      return lo;
    }

    /* First pass respects the readability floor: never shrink so far
       the text becomes unreadable, since below this the responsive
       rules have already stripped the slide down. */
    var scale = solve(0.55);
    /* If the slide genuinely cannot fit at that floor, the floor
       yields — never scrolling is the harder guarantee. Re-solving
       (rather than just clamping the scale) matters because the width
       is derived from the scale: clamping alone would leave the body
       sized for the old, larger scale and render it narrower than the
       rail, which showed up as a visibly off-centre slide on landscape
       phones (59px inset on the left, 137px on the right). */
    if (body.scrollHeight * scale > availBodyH + 1) scale = solve(0.01);
    body.style.setProperty('--body-fit', String(Math.round(scale * 1000) / 1000));

    /* Last-resort clamp, measured against the final layout: covers a
       convergence that ran out of rounds and genuine late reflow (a
       web-font finishing its swap after the measurements above).
       Layout metrics only, never getBoundingClientRect: a rect
       reflects this element's own transform, and while the entrance
       animation is running that transform is the animation's, not ours
       (see the .slide-body animation note in styles.css) — the rect
       would describe an unscaled box and this check would shrink an
       already-correct slide. */
    var finalH = body.scrollHeight;
    if (finalH > 0 && finalH * scale > availBodyH + 1) {
      scale = Math.max(0.01, availBodyH / finalH);
      body.style.setProperty('--body-fit', String(Math.round(scale * 1000) / 1000));
    }
  }

  function fitAll() { slides.forEach(fit); }

  /* Catches the SOURCE of drift, proactively: whenever a slide's own
     unscaled content size actually changes post-measurement (a font
     finishing its swap, an image finishing decode, anything), re-fit
     it. ResizeObserver fires on content-box changes only, never on
     fit()'s own transform/custom-property writes, so this can't loop. */
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var slide = entry.target.closest('.slide');
        if (slide) fit(slide);
      });
    });
    slides.forEach(function (s) {
      var inner = s.querySelector('.slide-inner');
      if (inner) ro.observe(inner);
    });
  }

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
    /* returning to the About slide (nav, dots, keys, back button, or
       the very first load) always retriggers the team auto-scroll */
    if (ids[index] === 'about' && typeof window.__teamResume === 'function') window.__teamResume();

    if (!opts.silent) {
      var hash = '#' + ids[index];
      if (location.hash !== hash) {
        if (opts.replace) history.replaceState({ i: index }, '', hash);
        else history.pushState({ i: index }, '', hash);
      }
    }
    fit(slides[index]);

    /* Safety net for the entrance "rise" animation: it's occasionally
       been observed stuck at time 0 forever (confirmed via
       getAnimations() — playState "running" but currentTime never
       advancing past 0), which freezes the element mid-animation
       (translateY(14px), never settling to 0) instead of just skipping
       the animation outright. Forcing it to completion once it should
       long be over fixes that regardless of why the clock stalled —
       same defensive spirit as fit()'s own verify-and-correct pass. */
    var entering = slides[index];
    setTimeout(function () {
      entering.querySelectorAll('.slide-inner > *, .slide-body > *').forEach(function (el) {
        el.getAnimations().forEach(function (a) { a.finish(); });
      });
      /* Mark it entered so the CSS above won't replay the entrance on
         any later return to this slide. Set regardless of where the
         deck has moved on to in the meantime — the point is that THIS
         slide has now had its one reveal. */
      entering.classList.add('has-entered');
    }, 800);
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
  /* The delayed resize-dispatch workaround that used to sit here is
     gone: the "boot needs a second pass to settle" symptom it papered
     over was the same stale-transform read fixed in fit()'s verify
     pass above, which is why a later pass appeared to "correct" the
     value. fonts.ready and load still re-fit for genuine late reflow. */

  /* ── Cycle diagram ──────────────────────────────────────────── */
  var cyBtns = Array.prototype.slice.call(document.querySelectorAll('[data-cy]'));
  var cyLis = Array.prototype.slice.call(document.querySelectorAll('.cy-l'));

  var deskPop = window.matchMedia('(min-width: 901px) and (min-height: 601px)');

  /* which step is expanded right now, or null */
  function cyOpenKey() {
    var d = document.querySelector('.cy-desc:not([hidden])');
    return d ? d.id.replace('cyd-', '') : null;
  }

  function cyReveal(i) {
    cyLis.forEach(function (li) {
      var rib = li.querySelector('.rib');
      var mine = rib && rib.dataset.cy === i;
      var descOpen = !li.querySelector('.cy-desc').hidden;
      li.classList.toggle('is-shown', mine || descOpen);
    });
  }

  /* pointer left the diagram: clear the labels, keeping only a step
     that is still expanded */
  function cyRest() {
    var open = cyOpenKey();
    cyLis.forEach(function (li) {
      var rib = li.querySelector('.rib');
      li.classList.toggle('is-shown', !!open && rib.dataset.cy === open);
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
      /* an expanded step holds the ring still even after the pointer
         leaves; closing the last open one hands it back. Without the
         resume, tapping a step on a touch screen — where there is no
         pointerleave to pick the spin back up — would park the ring
         for good. */
      if (open) easeToStop();
      else if (!cyOpenKey()) startSpin(angleOf(spinEl));
      /* popovers are absolutely positioned, so they can't change the
         slide's flow height; only the stacked layout needs a re-fit */
      if (!deskPop.matches) fit(slides[index]);
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
  /* Spins everywhere, phones included — the hover and desktop-size
     gates that used to be here meant the ring simply sat still on
     mobile. Only prefers-reduced-motion still turns it off. */
  var canSpin = spinEl && 'animate' in spinEl && !reduced.matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

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
  /* Hover is tracked on the whole diagram area, not just the ring:
     moving out to read a label must not restart the spin, or the
     label would be left pointing at a number that has moved on. */
  /* Real pointers only. On a touch screen a tap fires pointerenter with
     no matching pointerleave, so the ring would ease to a stop on first
     touch and never start again. */
  var cyArea = document.querySelector('.cycle-area');
  if (cyArea && canHover) {
    cyArea.addEventListener('pointerenter', function () { easeToStop(); });
    cyArea.addEventListener('pointerleave', function () {
      cyRest();
      /* an expanded step keeps it paused; otherwise pick the spin back up */
      if (!cyOpenKey()) startSpin(angleOf(spinEl));
    });
  }
  /* Touch: tapping anything outside the diagram hands the spin back.
     On a mouse that job belongs to pointerleave, which a touch screen
     never fires — so without this the ring stayed parked for the rest
     of the visit once a step had been tapped. Capture phase, so it
     still sees the touch when the target stops propagation (the team
     carousel does exactly that). Restarting from the ring's CURRENT
     angle means a tap while it is already spinning is seamless. */
  document.addEventListener('touchstart', function (e) {
    if (!canSpin || !spinEl) return;
    if (cyArea && cyArea.contains(e.target)) return;
    if (ids[index] !== 'model') return;
    startSpin(angleOf(spinEl));
  }, { passive: true, capture: true });

  function cycleSpinFor(slideId) {
    if (!canSpin) return;
    if (slideId === 'model') { if (!spinAnims.length) startSpin(angleOf(spinEl)); }
    else cancelSpin();
  }
  cycleSpinFor(ids[index]); /* boot ran show() before this section existed */

  /* ── Team carousel: continuous auto-scroll, 3 visible, whichever
        member sits nearest the centre is the highlighted one ──────── */
  (function () {
    var vp = document.querySelector('.team-vp');
    var list = document.querySelector('.team-list');
    var widget = vp && vp.closest('.team');
    if (!vp || !list || !widget) return;
    var base = Array.prototype.slice.call(list.children);
    var N = base.length;
    if (N < 4) return;

    /* Duplicate the whole set once: a continuous loop needs a second
       copy to scroll into as the first copy scrolls out, then wraps. */
    base.forEach(function (it) { list.appendChild(it.cloneNode(true)); });
    var all = Array.prototype.slice.call(list.children);

    var SPEED = 15;           // px/s of layout height — slow, ambient
    var TICK_MS = 40;          // ~25fps: smooth for a 15px/s creep, cheap
    var pos = 0;               // scrolled distance, px, wraps at setH
    var setH = 0;              // layout height of ONE full set (N rows)
    var playTimer = null;      // set <=> currently auto-scrolling
    var lastT = null;
    var stepTimer = null;      // in-flight button-step animation
    var touchDragging = false, touchY = 0, touchPos0 = 0;

    /* offsetHeight, not getBoundingClientRect(): the slide carries a
       --fit scale transform, so the rect is in scaled px while the
       translate we write is in layout px. Mixing them drifts the rows. */
    function rowPitch() {
      var gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      return base[0].offsetHeight + gap;
    }
    function measure() { setH = rowPitch() * N; }
    /* Modulo, not a single add/subtract: one correction only covers an
       overshoot of less than one full set, so a fast flick or a long
       drag could leave pos outside the range entirely and the list
       stranded past its own end — the loop visibly stops instead of
       coming back round. Modulo brings any magnitude back in range, so
       scrolling up from the first member lands on the last and vice
       versa however hard it is thrown. */
    function wrap() {
      if (setH <= 0) return;
      pos = ((pos % setH) + setH) % setH;
    }

    var lastMid = 0;
    function updateMid() {
      var now = performance.now();
      if (now - lastMid < 100) return; /* cheap throttle, not every frame */
      lastMid = now;
      var vpR = vp.getBoundingClientRect();
      var centerY = vpR.top + vpR.height / 2;
      var closest = null, closestD = Infinity;
      all.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < vpR.top - 4 || r.top > vpR.bottom + 4) return;
        var d = Math.abs((r.top + r.height / 2) - centerY);
        if (d < closestD) { closestD = d; closest = el; }
      });
      all.forEach(function (el) { el.classList.toggle('tm-mid', el === closest); });
    }

    function render() {
      list.style.transform = 'translateY(' + (-pos) + 'px)';
      updateMid();
    }

    /* setInterval, not requestAnimationFrame: this keeps the driving
       clock frame-rate independent (delta-timed via performance.now())
       and, unlike rAF, reliably fires in every embedding context this
       page runs in. Frame-independent math means the interval period
       is purely a smoothness/cost knob, not a correctness one. */
    function tickOnce() {
      var t = performance.now();
      if (lastT == null) lastT = t;
      pos += SPEED * ((t - lastT) / 1000);
      lastT = t;
      wrap();
      render();
    }
    function play() {
      if (playTimer || reduced.matches) return; /* reduced: stays parked */
      lastT = null;
      playTimer = setInterval(tickOnce, TICK_MS);
    }
    function pause() {
      clearInterval(playTimer);
      playTimer = null;
    }

    function cancelStepAnim() {
      if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
    }
    /* Buttons: pause, then glide exactly one row (eased, not a jump) */
    function stepManual(dir) {
      pause();
      cancelStepAnim();
      var from = pos, delta = dir * rowPitch(), dur = 420, start = performance.now();
      function ease(p) { return 1 - Math.pow(1 - p, 3); }
      stepTimer = setInterval(function () {
        var p = Math.min(1, (performance.now() - start) / dur);
        pos = from + delta * ease(p);
        wrap(); render();
        if (p >= 1) cancelStepAnim();
      }, TICK_MS);
    }

    /* Hover pause/resume — real mouse devices only, so touch never
       fires a synthetic hover that fights the tap-to-pause below. */
    if (window.matchMedia('(hover: hover)').matches) {
      widget.addEventListener('mouseenter', pause);
      widget.addEventListener('mouseleave', play);
    }

    var upBtn = document.getElementById('teamUp');
    var downBtn = document.getElementById('teamDown');
    if (upBtn) upBtn.addEventListener('click', function () { stepManual(-1); });
    if (downBtn) downBtn.addEventListener('click', function () { stepManual(1); });

    /* Wheel/trackpad: pauses, then browses one row per gesture (a
       burst of trackpad inertia counts as one gesture, not several) */
    var wheelTs = 0, wheelArmed = true;
    vp.addEventListener('wheel', function (e) {
      e.stopPropagation(); e.preventDefault();
      pause();
      var now = performance.now();
      if (now - wheelTs > 280) wheelArmed = true;
      wheelTs = now;
      if (!wheelArmed || Math.abs(e.deltaY) < 8) return;
      wheelArmed = false;
      stepManual(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    /* Touch: tapping/dragging inside pauses and drags freely; lifting
       the finger does NOT resume — only a tap outside the widget does */
    vp.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      pause();
      cancelStepAnim();
      touchDragging = true;
      touchY = e.touches[0].clientY;
      touchPos0 = pos;
    }, { passive: true });
    vp.addEventListener('touchmove', function (e) {
      if (!touchDragging) return;
      e.stopPropagation();
      pos = touchPos0 - (e.touches[0].clientY - touchY);
      wrap(); render();
    }, { passive: true });
    vp.addEventListener('touchend', function (e) { e.stopPropagation(); touchDragging = false; }, { passive: true });

    /* Tapping ANYWHERE else — another slide element, a nav arrow, a
       different part of the page — retriggers auto-scroll. Capture
       phase so it sees the touch before the target's own handlers
       (e.g. vp's stopPropagation) can matter. */
    document.addEventListener('touchstart', function (e) {
      if (!widget.contains(e.target)) play();
    }, { passive: true, capture: true });

    window.addEventListener('resize', function () { measure(); wrap(); render(); });
    measure();
    render();
    play();

    /* Switching to another slide and back (or a fresh load) also
       retriggers it — wired from show() via this global. */
    window.__teamResume = play;
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
