(function () {
  document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Mobile menu ---------------- */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------- Nav shadow on scroll ---------------- */
  var nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -10',
    end: 99999,
    toggleClass: { targets: nav, className: 'is-scrolled' }
  });

  /* ---------------- Reveal-up animations ---------------- */
  var reveals = gsap.utils.toArray('.reveal-up');
  reveals.forEach(function (el, i) {
    if (reduceMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  /* ---------------- Stat count-up ---------------- */
  gsap.utils.toArray('.stat-num').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(obj.val); }
        });
      }
    });
  });

  /* ---------------- Ticker marquee (GSAP tween, not CSS animation) ---------------- */
  (function () {
    var wrap = document.getElementById('ticker');
    var track = document.getElementById('ticker-track');
    if (!wrap || !track) return;

    var tween;
    function build() {
      if (tween) tween.kill();
      gsap.set(track, { xPercent: 0 });
      var distance = track.scrollWidth / 2;
      var duration = distance / 60;
      tween = gsap.to(track, {
        xPercent: -50,
        duration: duration,
        ease: 'none',
        repeat: -1
      });
    }
    if (!reduceMotion) {
      build();
      wrap.addEventListener('mouseenter', function () { tween && gsap.to(tween, { timeScale: 0.25, duration: 0.4 }); });
      wrap.addEventListener('mouseleave', function () { tween && gsap.to(tween, { timeScale: 1, duration: 0.4 }); });
      window.addEventListener('resize', build);
    }
  })();

  /* ---------------- Yard before/after drag slider ---------------- */
  (function () {
    var slider = document.getElementById('yard-slider');
    var handle = document.getElementById('yard-handle');
    if (!slider || !handle) return;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      slider.style.setProperty('--yard-pos', pct + '%');
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    function pctFromClientX(clientX) {
      var rect = slider.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    var dragging = false;

    function onMove(e) {
      if (!dragging) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(pctFromClientX(clientX));
    }
    function onUp() {
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    function onDown(e) {
      dragging = true;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(pctFromClientX(clientX));
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      e.preventDefault();
    }

    slider.addEventListener('pointerdown', onDown);
    handle.addEventListener('keydown', function (e) {
      var current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft') { setPos(current - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPos(current + 5); e.preventDefault(); }
    });

    setPos(50);

    if (!reduceMotion) {
      ScrollTrigger.create({
        trigger: slider,
        start: 'top 80%',
        once: true,
        onEnter: function () {
          var proxy = { pos: 50 };
          gsap.timeline()
            .to(proxy, { pos: 32, duration: 0.7, ease: 'power2.inOut', delay: 0.3, onUpdate: function () { setPos(proxy.pos); } })
            .to(proxy, { pos: 50, duration: 0.6, ease: 'power2.out', onUpdate: function () { setPos(proxy.pos); } });
        }
      });
    }
  })();

  /* ---------------- Patrol Route: self-drawing path ---------------- */
  (function () {
    var wrap = document.querySelector('.route-wrap');
    var path = document.getElementById('route-path-fg');
    var stops = gsap.utils.toArray('.route-stop');
    if (!wrap || !path) return;

    var length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    if (reduceMotion) {
      gsap.set(path, { strokeDashoffset: 0 });
      stops.forEach(function (s) { s.classList.add('is-lit'); });
      return;
    }

    var thresholds = [0.12, 0.5, 0.88];

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 70%',
      end: 'bottom 60%',
      scrub: 0.6,
      onUpdate: function (self) {
        gsap.set(path, { strokeDashoffset: length * (1 - self.progress) });
        stops.forEach(function (stop, i) {
          stop.classList.toggle('is-lit', self.progress >= thresholds[i]);
        });
      }
    });
  })();

  /* ---------------- Open/closed status ---------------- */
  (function () {
    var el = document.getElementById('open-status');
    if (!el) return;
    var now = new Date();
    var day = now.getDay();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isOpen = day !== 0 && hour >= 7 && hour < 19;
    el.textContent = isOpen ? 'Open Now' : 'Closed Now';
    el.style.color = isOpen ? 'var(--primary)' : 'var(--accent)';
  })();

  /* ---------------- Quote form validation ---------------- */
  (function () {
    var form = document.getElementById('quote-form');
    if (!form) return;
    var success = document.getElementById('form-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (field) {
        var wrap = field.closest('.form-field');
        var filled = field.value && field.value.trim().length > 0;
        wrap.classList.toggle('invalid', !filled);
        if (!filled) valid = false;
      });
      if (!valid) return;

      form.classList.add('submitted');
      success.classList.add('show');
      form.reset();
    });

    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('input', function () {
        field.closest('.form-field').classList.remove('invalid');
      });
    });
  })();

  /* ---------------- Refresh ScrollTrigger once layout settles ---------------- */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
