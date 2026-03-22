
(function () {
  'use strict';

  /* ── Utils ─────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  /*  STICKY BAR*/
  var sBar = $('stickyBar');
  var hero = $('heroFold');
  if (sBar && hero) {
    function tickSticky() {
      var show = hero.getBoundingClientRect().bottom < 80;
      sBar.classList.toggle('is-visible', show);
      sBar.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    window.addEventListener('scroll', tickSticky, { passive: true });
    window.addEventListener('resize', tickSticky, { passive: true });
    tickSticky();
  }

  /*CAROUSEL */
  var carStage = $('carStage');
  var carImg = $('carImg');
  var zoomLens = $('zoomLens');
  var zoomRes = $('zoomResult');
  var carThumbs = $('carThumbs');
  var prevBtn = $('carPrev');
  var nextBtn = $('carNext');

  if (carImg && carThumbs) {
    carImg.style.transition = 'opacity .18s ease';

    var thumbBtns = qsa('.car__thumb', carThumbs);
    var images = thumbBtns.map(function (b) {
      return { src: b.dataset.src, zoom: b.dataset.zoom };
    });
    var cur = 0;


    var LW = 140;
    var LH = 120;

    function goTo(i) {
      if (!images.length) return;
      cur = (i + images.length) % images.length;
      var entry = images[cur];

      /* Fade swap */
      carImg.style.opacity = '0';
      setTimeout(function () {
        carImg.src = entry.src;
        if (zoomRes && entry.zoom) {
          zoomRes.style.backgroundImage = 'url(' + entry.zoom + ')';
        }
        carImg.style.opacity = '1';
      }, 160);

      /* Sync thumbnails */
      thumbBtns.forEach(function (b, idx) {
        b.classList.toggle('car__thumb--on', idx === cur);
        b.setAttribute('aria-selected', idx === cur ? 'true' : 'false');
      });
    }

    /* Init zoom result background */
    if (zoomRes && images[0] && images[0].zoom) {
      zoomRes.style.backgroundImage = 'url(' + images[0].zoom + ')';
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(cur - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(cur + 1); });

    carThumbs.addEventListener('click', function (e) {
      var btn = e.target.closest('.car__thumb');
      if (!btn) return;
      var idx = thumbBtns.indexOf(btn);
      if (idx !== -1) goTo(idx);
    });

    /* Keyboard navigation */
    document.addEventListener('keydown', function (e) {
      if (!carStage) return;
      if (e.key === 'ArrowLeft') goTo(cur - 1);
      if (e.key === 'ArrowRight') goTo(cur + 1);
    });

    /* Touch swipe */
    if (carStage) {
      var touchStartX = 0;
      carStage.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      carStage.addEventListener('touchend', function (e) {
        var dx = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 40) goTo(cur + (dx > 0 ? 1 : -1));
      }, { passive: true });
    }
  }

  /* IMAGE ZOOM */
  if (carStage && zoomLens && zoomRes) {
    var zoomBadge = carStage.querySelector('.zoom-badge');

    /* Ensure badge is invisible on load */
    if (zoomBadge) zoomBadge.style.display = 'none';

    /* Only wire zoom for mouse users */
    if (window.matchMedia('(pointer: fine)').matches) {

      carStage.addEventListener('mouseenter', function () {
        zoomLens.style.display = 'block';
        zoomRes.style.display = 'block';
        if (zoomBadge) zoomBadge.style.display = 'flex';
      });

      carStage.addEventListener('mouseleave', function () {
        zoomLens.style.display = 'none';
        zoomRes.style.display = 'none';
        if (zoomBadge) zoomBadge.style.display = 'none';
      });

      carStage.addEventListener('mousemove', function (e) {
        var rect = carStage.getBoundingClientRect();
        var sw = rect.width;
        var sh = rect.height;
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        /* Keep lens fully inside the stage */
        var lx = clamp(mx - LW / 2, 0, sw - LW);
        var ly = clamp(my - LH / 2, 0, sh - LH);

        zoomLens.style.left = lx + 'px';
        zoomLens.style.top = ly + 'px';

        /* Centre badge inside lens */
        if (zoomBadge) {
          zoomBadge.style.position = 'absolute';
          zoomBadge.style.left = (lx + LW / 2) + 'px';
          zoomBadge.style.top = (ly + LH / 2) + 'px';
          zoomBadge.style.transform = 'translate(-50%,-50%)';
        }

        /* Compute zoom result background */
        var rw = zoomRes.offsetWidth || 300;
        var rh = zoomRes.offsetHeight || 280;
        var rx = rw / LW;
        var ry = rh / LH;
        zoomRes.style.backgroundSize = (sw * rx) + 'px ' + (sh * ry) + 'px';
        zoomRes.style.backgroundPosition = (-lx * rx) + 'px ' + (-ly * ry) + 'px';
      });
    }
  }

  /* NAV DROPDOWN */
  var dropBtn = $('navDropBtn');
  var dropMenu = $('dropMenu');
  if (dropBtn && dropMenu) {
    function openDrop() { dropMenu.classList.add('is-open'); dropBtn.setAttribute('aria-expanded', 'true'); }
    function closeDrop() { dropMenu.classList.remove('is-open'); dropBtn.setAttribute('aria-expanded', 'false'); }

    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropMenu.classList.contains('is-open') ? closeDrop() : openDrop();
    });
    document.addEventListener('click', function (e) {
      if (!dropBtn.contains(e.target) && !dropMenu.contains(e.target)) closeDrop();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrop();
    });
  }

  /* MOBILE HAMBURGER */
  var ham = $('ham');
  var navLinks = $('navLinks');
  if (ham && navLinks) {
    ham.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      ham.classList.toggle('is-open', open);
      ham.setAttribute('aria-expanded', String(open));
    });
    qsa('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        ham.classList.remove('is-open');
        ham.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (!ham.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('is-open');
        ham.classList.remove('is-open');
        ham.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* FAQ ACCORDION*/
  var faqList = $('faqList');
  if (faqList) {
    faqList.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq-q');
      if (!btn) return;

      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('faq-item--open');

      /* Close all items */
      qsa('.faq-item', faqList).forEach(function (i) {
        i.classList.remove('faq-item--open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });

      /* If clicked item was closed, open it */
      if (!isOpen) {
        item.classList.add('faq-item--open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* PROCESS STEPPER */
  var procTabs = $('procTabs');
  if (procTabs) {
    var pTabs = qsa('.proc-tab', procTabs);
    var pPanels = qsa('.proc-panel');
    var pCur = 0;

    function goProc(i) {
      pCur = (i + pTabs.length) % pTabs.length;
      pTabs.forEach(function (t, idx) {
        t.classList.toggle('proc-tab--on', idx === pCur);
        t.setAttribute('aria-selected', idx === pCur ? 'true' : 'false');
      });
      pPanels.forEach(function (p) {
        p.classList.toggle('proc-panel--on', parseInt(p.dataset.p, 10) === pCur);
      });
    }

    /* Tab clicks */
    procTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.proc-tab');
      if (!btn) return;
      goProc(parseInt(btn.dataset.p, 10));
    });

    /* Image prev/next — delegate on whole section */
    var procSection = document.querySelector('.s-proc');
    if (procSection) {
      procSection.addEventListener('click', function (e) {
        if (e.target.closest('#procPrev')) goProc(pCur - 1);
        if (e.target.closest('#procNext')) goProc(pCur + 1);
      });
    }
  }

  /*INDUSTRIES CAROUSEL */
  var indTrack = $('indTrack');
  var indPrev = $('indPrev');
  var indNext = $('indNext');
  if (indTrack) {
    function getStep() {
      var card = indTrack.querySelector('.ind-card');
      if (card) {
        var gap = parseInt(window.getComputedStyle(indTrack).columnGap) || 18;
        return card.offsetWidth + gap;
      }
      return 296;
    }
    if (indPrev) indPrev.addEventListener('click', function () { indTrack.scrollBy({ left: -getStep(), behavior: 'smooth' }); });
    if (indNext) indNext.addEventListener('click', function () { indTrack.scrollBy({ left: getStep(), behavior: 'smooth' }); });

    var isx = 0;
    indTrack.addEventListener('touchstart', function (e) { isx = e.touches[0].clientX; }, { passive: true });
    indTrack.addEventListener('touchend', function (e) {
      var dx = isx - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) indTrack.scrollBy({ left: dx > 0 ? getStep() : -getStep(), behavior: 'smooth' });
    }, { passive: true });
  }

  /*  FORMS */
  function bindForm(id) {
    var f = $(id);
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('[type="submit"]');
      if (!btn) return;
      var orig = btn.textContent;
      btn.textContent = '✓ Sent! We\'ll be in touch.';
      btn.style.background = '#16A34A';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.background = '';
        btn.disabled = false;
        f.reset();
      }, 3500);
    });
  }
  bindForm('contactForm');

  var catForm = document.querySelector('.cat-form');
  if (catForm) {
    catForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = catForm.querySelector('input[type="email"]');
      var btn = catForm.querySelector('[type="submit"]');
      if (!inp || !isEmail(inp.value)) {
        inp.style.borderColor = '#E42B2B';
        inp.style.boxShadow = '0 0 0 3px rgba(228,43,43,.12)';
        inp.focus();
        setTimeout(function () {
          inp.style.borderColor = '';
          inp.style.boxShadow = '';
        }, 2200);
        return;
      }
      var orig = btn.textContent;
      btn.textContent = '✓ Request sent!';
      btn.style.background = '#16A34A';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.background = '';
        btn.disabled = false;
        catForm.reset();
      }, 3500);
    });
  }

  /* SCROLL REVEAL*/
  if ('IntersectionObserver' in window && !document.getElementById('sr-style')) {
    var revStyle = document.createElement('style');
    revStyle.id = 'sr-style';
    revStyle.textContent =
      '.feat-card,.port-card,.testi-card,.ind-card{' +
      'opacity:0;transform:translateY(16px);' +
      'transition:opacity .44s ease,transform .44s ease' +
      '}' +
      '.sr-on{opacity:1!important;transform:none!important}' +
      '.feat-grid .feat-card:nth-child(2){transition-delay:.07s}' +
      '.feat-grid .feat-card:nth-child(3){transition-delay:.14s}' +
      '.feat-grid .feat-card:nth-child(4){transition-delay:.21s}' +
      '.feat-grid .feat-card:nth-child(5){transition-delay:.28s}' +
      '.feat-grid .feat-card:nth-child(6){transition-delay:.35s}' +
      '.port-grid .port-card:nth-child(2){transition-delay:.07s}' +
      '.port-grid .port-card:nth-child(3){transition-delay:.14s}';
    document.head.appendChild(revStyle);

    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('sr-on');
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -28px 0px' });

    qsa('.feat-card,.port-card,.testi-card,.ind-card').forEach(function (el) {
      revObs.observe(el);
    });
  }

  /* CATALOGUE MODAL */
  var catModal = $('catModal');
  var dlBtn = $('dlBtn');
  var modalClose = $('modalClose');
  var modalForm = $('modalForm');

  function openModal() {
    if (!catModal) return;
    catModal.classList.add('is-open');
    catModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var inp = catModal.querySelector('#modalEmail');
    if (inp) setTimeout(function () { inp.focus(); }, 60);
  }

  function closeModal() {
    if (!catModal) return;
    catModal.classList.remove('is-open');
    catModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalForm) modalForm.reset();
    qsa('.modal-inp', catModal).forEach(function (i) {
      i.classList.remove('is-error');
    });
  }

  if (dlBtn) {
    dlBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  }

  /* QUOTE / CALL-BACK MODAL */
  var quoteModal = $('quoteModal');
  var quoteModalClose = $('quoteModalClose');
  var quoteModalForm = $('quoteModalForm');
  var quoteBtn = $('quoteBtn');

  function openQuoteModal() {
    if (!quoteModal) return;
    quoteModal.classList.add('is-open');
    quoteModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var inp = $('qmName');
    if (inp) setTimeout(function () { inp.focus(); }, 60);
  }

  function closeQuoteModal() {
    if (!quoteModal) return;
    quoteModal.classList.remove('is-open');
    quoteModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (quoteModalForm) quoteModalForm.reset();
    qsa('.modal-inp', quoteModal).forEach(function (i) {
      i.classList.remove('is-error');
    });
  }

  if (quoteBtn) {
    quoteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openQuoteModal();
    });
  }

  if (quoteModalClose) quoteModalClose.addEventListener('click', closeQuoteModal);

  /* Close on overlay click */
  if (quoteModal) {
    quoteModal.addEventListener('click', function (e) {
      if (e.target === quoteModal) closeQuoteModal();
    });
  }

  /* Close on Escape — handles both modals */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (catModal && catModal.classList.contains('is-open')) closeModal();
      if (quoteModal && quoteModal.classList.contains('is-open')) closeQuoteModal();
    }
  });

  /* Quote modal form submit */
  if (quoteModalForm) {
    quoteModalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInp = $('qmEmail');
      if (!emailInp || !isEmail(emailInp.value)) {
        emailInp.classList.add('is-error');
        emailInp.focus();
        setTimeout(function () { emailInp.classList.remove('is-error'); }, 2200);
        return;
      }
      var submitBtn = quoteModalForm.querySelector('[type="submit"]');
      var orig = submitBtn.textContent;
      submitBtn.textContent = '✓ We\'ll call you back!';
      submitBtn.style.background = '#16A34A';
      submitBtn.disabled = true;
      setTimeout(function () {
        closeQuoteModal();
        submitBtn.textContent = orig;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 2500);
    });
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);

  /* Close on overlay click (but not card click) */
  if (catModal) {
    catModal.addEventListener('click', function (e) {
      if (e.target === catModal) closeModal();
    });
  }

  /* Modal form submit */
  if (modalForm) {
    modalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInp = $('modalEmail');
      if (!emailInp || !isEmail(emailInp.value)) {
        emailInp.classList.add('is-error');
        emailInp.focus();
        setTimeout(function () { emailInp.classList.remove('is-error'); }, 2200);
        return;
      }
      var submitBtn = modalForm.querySelector('[type="submit"]');
      var orig = submitBtn.textContent;
      submitBtn.textContent = '✓ Sent! Check your inbox.';
      submitBtn.style.background = '#16A34A';
      submitBtn.disabled = true;
      setTimeout(function () {
        closeModal();
        submitBtn.textContent = orig;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 2500);
    });
  }

}());