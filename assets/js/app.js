// jQuery-based fullpage navigation
// Requirements: sections with class .screen and data-index starting from 0

(function () {
  const $doc = $(document);
  const $win = $(window);
  const $app = $('#app');
  const $screens = $('.screen');
  let currentIndex = 0;
  let isAnimating = false;
  let $crossfadeLayer = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getMaxIndex() {
    return $screens.length - 1;
  }

  function setTransform(index) {
    const offsetY = index * -100;
    $app.css({
      transform: `translate3d(0, ${offsetY}vh, 0)`,
      transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)'
    });
  }

  function ensureCrossfadeLayer() {
    if ($crossfadeLayer && $crossfadeLayer.length) return $crossfadeLayer;
    $crossfadeLayer = $('<div class="crossfade-layer"></div>');
    $('body').append($crossfadeLayer);
    return $crossfadeLayer;
  }

  function crossfadeTo(targetIndex) {
    const $layer = ensureCrossfadeLayer();
    $layer.empty();
    const $clone = $screens.eq(targetIndex).clone(true, true);
    $clone.css({ opacity: 0 });
    $layer.append($clone);
    // Force reflow then show
    void $clone[0].offsetWidth;
    $layer.addClass('show');
    $clone.css({ opacity: 1 });
  }

  function setActiveScreen(index) {
    $screens.removeClass('screen--active');
    const $target = $screens.eq(index);
    $target.addClass('screen--active');
  }

  function goToSection(index, options) {
    const target = clamp(index, 0, getMaxIndex());
    if (target === currentIndex || isAnimating) return;

    // Special transition: from screen 1 (index 0) to screen 2 (index 1)
    if (currentIndex === 0 && target === 1) {
      return transitionFromFirstToSecond(options);
    }

    isAnimating = true;
    setActiveScreen(target);
    // allow CSS opacity transition to complete
    const doneMs = 900;
    setTimeout(() => {
      currentIndex = target;
      if ($crossfadeLayer) { $crossfadeLayer.removeClass('show').empty(); }
      isAnimating = false;
    }, doneMs);
  }

  function transitionFromFirstToSecond(options) {
    // match the CSS transition for video expansion (3000ms) + hold (3000ms) + fade (800ms)
    const expandMs = 3000;
    const holdMs = 0;
    const fadeMs = 800;
    const $body = $('body');
    isAnimating = true;
    $body.addClass('screen-1-exit screen-2-reveal');

    // after expansion completes, immediately fade video out and crossfade in screen 2
    setTimeout(() => {
      $body.addClass('screen-1-video-fade');
      // start revealing screen 2
      $body.addClass('screen-2-visible');
      setActiveScreen(1);
      setTimeout(() => {
        currentIndex = 0;
        isAnimating = false;
        // keep classes so the final state persists
      }, fadeMs + 50);
    }, expandMs + holdMs + 50);
  }

  // Expose for programmatic navigation
  window.goToSection = goToSection;

  function next() { goToSection(currentIndex + 1); }
  function prev() { goToSection(currentIndex - 1); }

  function onWheel(e) {
    if (isAnimating) return;
    const delta = e.originalEvent.deltaY;
    if (delta > 10) next();
    else if (delta < -10) prev();
  }

  function onKeydown(e) {
    if (isAnimating) return;
    const key = e.key;
    if (key === 'ArrowDown' || key === 'PageDown') next();
    else if (key === 'ArrowUp' || key === 'PageUp') prev();
    else if (key === 'Home') goToSection(0);
    else if (key === 'End') goToSection(getMaxIndex());
  }

  // Touch swipe
  let touchStartY = 0;
  let touchEndY = 0;
  function onTouchStart(e) {
    touchStartY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;
  }
  function onTouchMove(e) {
    touchEndY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.clientY;
  }
  function onTouchEnd() {
    const delta = touchStartY - touchEndY;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) next(); else prev();
  }

  // Data attribute click: [data-goto="index"]
  $doc.on('click', '[data-goto]', function (e) {
    e.preventDefault();
    const idxStr = $(this).attr('data-goto');
    const idx = Number(idxStr);
    if (!Number.isNaN(idx)) goToSection(idx);
  });

  // Initialize layout size changes (optional)
  $win.on('resize', function () {
    // Re-apply transform to align with vh snapping after resize
    setTransform(currentIndex);
  });

  // Bind events
  $win.on('wheel', onWheel);
  $doc.on('keydown', onKeydown);
  $doc.on('touchstart', onTouchStart);
  $doc.on('touchmove', onTouchMove);
  $doc.on('touchend', onTouchEnd);

  // Initial
  setTransform(0);

  // Tagline swap for mobile
  function applyTagline() {
    const $tag = $('#tagline');
    if (!$tag.length) return;
    const fullTxt = $tag.attr('data-full');
    const shortTxt = $tag.attr('data-short');
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    $tag.text(isMobile ? (shortTxt || '') : (fullTxt || ''));
  }
  applyTagline();
  $win.on('resize', applyTagline);
})();

