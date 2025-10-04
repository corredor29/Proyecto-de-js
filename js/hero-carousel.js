/* /js/hero-carousel.js */
(() => {
  const slider = document.querySelector('.hero-slider');
  if (!slider) return;

  const track = slider.querySelector('#heroTrack');
  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  const prevBtn = slider.querySelector('.hero-arrow.prev');
  const nextBtn = slider.querySelector('.hero-arrow.next');
  const dotsWrap = slider.querySelector('#heroDots');

  if (!track || slides.length === 0) return;

  // --- Config ---
  const AUTOPLAY_MS = 6000;       // set to 0 to disable autoplay
  const SWIPE_THRESHOLD = 40;     // px
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;

  // Build dots
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i, true));
      dotsWrap.appendChild(dot);
    });
  }

  function setActive(i) {
    slides.forEach((s, si) => {
      const active = si === i;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
      s.tabIndex = active ? 0 : -1;
    });
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((d, di) => {
        d.setAttribute('aria-selected', di === i ? 'true' : 'false');
      });
    }
    const single = slides.length <= 1;
    prevBtn && (prevBtn.style.display = single ? 'none' : '');
    nextBtn && (nextBtn.style.display = single ? 'none' : '');
    dotsWrap && (dotsWrap.style.display = single ? 'none' : '');
  }

  function goTo(i, userAction = false) {
    index = (i + slides.length) % slides.length;
    setActive(index);
    if (userAction) restartAutoplay();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function startAutoplay() {
    if (reduceMotion || AUTOPLAY_MS <= 0 || slides.length <= 1) return;
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restartAutoplay() { stopAutoplay(); startAutoplay(); }

  // Events: arrows
  prevBtn?.addEventListener('click', () => prev());
  nextBtn?.addEventListener('click', () => next());

  // Keyboard arrows (only when slider is in view)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Pause on hover
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  // Touch swipe
  let startX = 0, swiping = false;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    swiping = true;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      swiping = false;
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  track.addEventListener('touchend', () => {
    swiping = false;
    startAutoplay();
  });

  // Pause autoplay if tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });

  // Init
  buildDots();
  setActive(index);
  startAutoplay();
})();
